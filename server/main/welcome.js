import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { getClaudeStatus } from "../apps/claude-code/service/status.js";
import { getCodexStatus } from "../apps/codex/service/status.js";
import { getSettings } from "./service/settings/get.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");

const safeStat = (target) => {
  try { return statSync(target); } catch { return null; }
};

const runGit = (args) => {
  const result = spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8"
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() || "",
    stderr: result.stderr?.trim() || ""
  };
};

const parseAppMeta = (appId, locale) => {
  const appDoc = path.join(ROOT_DIR, "apps", locale, appId, "APP.md");
  const serverDoc = path.join(ROOT_DIR, "server", "apps", appId, "APP.md");
  const docPath = existsSync(appDoc) ? appDoc : serverDoc;
  const frontendDir = path.join(ROOT_DIR, "gui", "src", "apps", appId);
  const backendDir = path.join(ROOT_DIR, "server", "apps", appId);
  const meta = {
    id: appId,
    title: appId,
    description: "",
    backend: existsSync(backendDir) ? path.relative(ROOT_DIR, backendDir) : "",
    frontend: existsSync(frontendDir) ? path.relative(ROOT_DIR, frontendDir) : "",
    doc: existsSync(docPath) ? path.relative(ROOT_DIR, docPath) : ""
  };
  if (!existsSync(docPath)) return meta;

  const text = readFileSync(docPath, "utf8");
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return meta;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line === "---") break;
    if (line.startsWith("name:")) meta.title = line.replace(/^name:\s*/, "").trim() || meta.title;
    if (line.startsWith("description:")) meta.description = line.replace(/^description:\s*/, "").trim();
    if (line.startsWith("backend:")) meta.backend = line.replace(/^backend:\s*/, "").trim() || meta.backend;
    if (line.startsWith("frontend:")) meta.frontend = line.replace(/^frontend:\s*/, "").trim() || meta.frontend;
  }
  return meta;
};

const listAppDocs = (locale = "zh") => {
  const appsRoot = path.join(ROOT_DIR, "apps", locale);
  if (!existsSync(appsRoot)) return [];
  return readdirSync(appsRoot)
    .filter((name) => safeStat(path.join(appsRoot, name))?.isDirectory())
    .map((name) => parseAppMeta(name, locale))
    .sort((a, b) => a.id.localeCompare(b.id));
};

const listAppDbs = () => {
  const dir = path.join(ROOT_DIR, "database", "apps");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".db"))
    .sort();
};

const listSkills = () => {
  const dir = path.join(ROOT_DIR, "skills");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => safeStat(path.join(dir, name))?.isDirectory())
    .sort();
};

const toUrlBase = (req) => `http://${req.headers.host}`;

const API_GROUPS = [
  { group: "系统 / 设置",  items: ["GET /api/health", "GET|POST /api/settings", "GET /api/settings/skills", "GET /api/system/setup", "POST /api/system/reload/request"] },
  { group: "聊天",        items: ["GET /api/chat/list", "POST /api/chat/create", "GET /api/chat/messages?conversationId=", "POST /api/chat/rename", "POST /api/chat/delete", "POST /api/chat/attachments/upload", "WS /ws"] },
  { group: "任务(Task)", items: ["POST /api/task/create/instant — 一次性同步 LLM 调用", "POST /api/task/create/agent — 异步多轮 agent 任务", "GET /api/task · /api/task/detail · /api/task/messages", "POST /api/task/stop"] },
  { group: "记忆",        items: ["GET /api/memory/list · /api/memory/get", "POST /api/memory/create · /api/memory/update · /api/memory/delete"] },
  { group: "文件",        items: ["GET /api/fs/roots · /api/fs/list · /api/fs/read", "POST /api/fs/write · /api/fs/mkdir · /api/fs/delete · /api/fs/upload", "GET /api/fs/download"] },
  { group: "应用",        items: ["/apps/<id>/* — 每个 app 自己的接口,主服务自动反代"] }
];

const buildWelcomeData = async (req) => {
  const settings = getSettings();
  const locale = settings.language || "zh";
  const gitBranch = runGit(["branch", "--show-current"]);
  const gitCommit = runGit(["rev-parse", "--short", "HEAD"]);
  const gitDirty = runGit(["status", "--porcelain"]);
  const [claudeStatus, codexStatus] = await Promise.all([
    getClaudeStatus(),
    getCodexStatus()
  ]);

  return {
    name: "AIOS",
    tagline: "AI 时代的操作系统",
    generatedAt: new Date().toISOString(),
    root: ROOT_DIR,
    servers: {
      main: "http://127.0.0.1:9501",
      apps: "http://127.0.0.1:9502",
      currentBase: toUrlBase(req)
    },
    git: {
      branch: gitBranch.ok ? gitBranch.stdout : "",
      commit: gitCommit.ok ? gitCommit.stdout : "",
      dirty: Boolean(gitDirty.stdout)
    },
    philosophy: [
      "AIOS 是一个 AI 驱动的本地个人操作系统。用户用自然语言说出需求,AIOS 替他跑任务、搭应用、管理信息、沉淀记忆。",
      "交互是双模态的:对话 + 图形界面。对话负责意图,界面负责承载结果。应用不是装饰,形态即是价值。",
      "AI 和应用之间是双向的:AI 可以操作应用,应用也可以反过来向 AI 下发任务(Task)。",
      "一切本地运行。数据、密钥、记忆都属于用户自己。"
    ],
    layout: {
      frontend:        { path: "gui/",              note: "前端 Vue 源码" },
      frontendApps:    { path: "gui/src/apps/",     note: "每个 app 的前端" },
      mainServer:      { path: "server/main/",      note: "主服务(9501):/api/*, /ws, /welcome, 静态文件" },
      appsServer:      { path: "server/apps/",      note: "应用服务(9502):/apps/<id>/*,主服务反代" },
      prompts:         { path: "server/main/prompt/", note: "系统提示词装配" },
      systemDatabase:  { path: "database/aios.db",  note: "系统 SQLite:chat / memory / settings / task 等" },
      appDatabases:    { path: "database/apps/",    note: "每个 app 各自的 SQLite" },
      files:           { path: "files/",            note: "用户文件 / 附件 / 上传" },
      skills:          { path: "skills/",           note: "可挂载的扩展能力" },
      appDocs:         { path: `apps/${locale}/`,   note: "顶级应用说明资产,按语言组织" },
      language:        { path: "language/",         note: "zh/en 语言包,启动时烘焙进代码占位符" }
    },
    apiGroups: API_GROUPS,
    apps: listAppDocs(locale),
    codingAgents: {
      claudeCode: {
        appId: "claude-code",
        statusEndpoint: "/apps/claude-code/status",
        conversationsEndpoint: "/apps/claude-code/conversations",
        messagesEndpoint: "/apps/claude-code/messages?conversationId=<id>",
        sendEndpoint: "/apps/claude-code/send",
        ...claudeStatus
      },
      codex: {
        appId: "codex",
        statusEndpoint: "/apps/codex/status",
        conversationsEndpoint: "/apps/codex/conversations",
        messagesEndpoint: "/apps/codex/messages?conversationId=<id>",
        sendEndpoint: "/apps/codex/send",
        ...codexStatus
      },
      guidance: [
        "install 状态以上面为准,不要臆测。",
        "典型顺序:status → conversations → (create) → messages → send。",
        "/send 返回 application/x-ndjson 流,按行解析 {type:'event'|'done'|'error'}。"
      ]
    },
    databases: {
      system: existsSync(path.join(ROOT_DIR, "database", "aios.db")) ? "database/aios.db" : null,
      systemSchemaHint: "表定义见 `server/main/repository/**/*.js`(create.js / get.js / save.js 等)",
      apps: listAppDbs().map((name) => `database/apps/${name}`),
      appSchemaHint: "每个 app 的表定义见 `server/apps/<id>/repository/` 或各 app 内部 initDb()"
    },
    skillsList: listSkills(),
    recommendedReading: [
      "server/main/prompt/INSTRUCTION.md  ← 硬规则",
      "server/main/prompt/codingAgents.js ← coding agent app 的调用约定",
      `apps/${locale}/<app>/APP.md          ← 各 app 的说明源`,
      "README.md / README_en.md           ← 项目理念"
    ]
  };
};

const boolText = (value) => value ? "true" : "false";

const toMarkdown = (data) => {
  const philosophyLines = data.philosophy.map((line) => `- ${line}`).join("\n");

  const layoutLines = Object.values(data.layout)
    .map((entry) => `- \`${entry.path}\` — ${entry.note}`)
    .join("\n");

  const apiGroupLines = data.apiGroups
    .map((group) => {
      const lines = group.items.map((item) => `  - \`${item}\``).join("\n");
      return `**${group.group}**\n${lines}`;
    })
    .join("\n\n");

  const appLines = data.apps.length
    ? data.apps.map((app) => {
        const desc = app.description ? ` — ${app.description}` : "";
        const suffix = [
          app.doc && `doc: \`${app.doc}\``,
          app.backend && `backend: \`${app.backend}\``,
          app.frontend && `frontend: \`${app.frontend}\``
        ].filter(Boolean).join(" · ");
        return `- **${app.id}**${desc}\n  ${suffix}`;
      }).join("\n")
    : "- (no app docs found)";

  const agentGuideLines = data.codingAgents.guidance.map((line) => `- ${line}`).join("\n");

  const skillsLine = data.skillsList.length
    ? data.skillsList.map((s) => `\`${s}\``).join(", ")
    : "(empty)";

  const appDbsLines = data.databases.apps.length
    ? data.databases.apps.map((file) => `  - \`${file}\``).join("\n")
    : "  - (no app db files yet)";

  const readingLines = data.recommendedReading.map((line) => `- ${line}`).join("\n");

  return `# AIOS

${data.name} — ${data.tagline}
Root: \`${data.root}\`
Base: ${data.servers.currentBase}
Generated: ${data.generatedAt}
Git: ${data.git.branch || "-"} @ ${data.git.commit || "-"} (dirty=${boolText(data.git.dirty)})

> 机器可读版:\`GET /welcome.json\`

---

## 这是什么

${philosophyLines}

---

## 目录地图

${layoutLines}

服务端口:主服务 \`${data.servers.main}\`(前端 / \`/api/*\` / \`/ws\` / \`/welcome\` / \`/files/*\`,并把 \`/apps/*\` 反代给应用服务 \`${data.servers.apps}\`)。

---

## 可用 Apps

${appLines}

---

## Coding Agents

- **claude-code**: installed=${boolText(Boolean(data.codingAgents.claudeCode.installed))} · version=${data.codingAgents.claudeCode.version || "-"} · cliPath=\`${data.codingAgents.claudeCode.cliPath || "-"}\`
- **codex**: installed=${boolText(Boolean(data.codingAgents.codex.installed))} · version=${data.codingAgents.codex.version || "-"} · cliPath=\`${data.codingAgents.codex.cliPath || "-"}\`

端点:\`GET status\` · \`GET conversations\` · \`POST conversations/create\` · \`GET messages?conversationId=\` · \`POST send\`

${agentGuideLines}

---

## 数据位置

- system: ${data.databases.system ? `\`${data.databases.system}\`` : "(缺失)"}
  - ${data.databases.systemSchemaHint}
- apps:
${appDbsLines}
  - ${data.databases.appSchemaHint}
- 用户文件:\`files/\`

## Skills

${skillsLine}

---

## 主要 API(需要时用,不强制)

${apiGroupLines}

WebSocket 协议补充:消息发 \`{ type: 'message'|'ping'|'abort', conversationId, content?, attachments? }\`,服务端回 \`delta / tool_call / tool_result / done / error / aborted\`。

---

## 继续阅读

${readingLines}
`;
};

const handleWelcome = async (req, res, requestPath) => {
  const data = await buildWelcomeData(req);
  if (requestPath === "/welcome.json") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
    return true;
  }
  if (requestPath === "/welcome") {
    res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
    res.end(toMarkdown(data));
    return true;
  }
  return false;
};

export {
  handleWelcome
};
