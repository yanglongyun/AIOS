import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { getClaudeStatus } from "./claude-code/service/status.js";
import { getCodexStatus } from "./codex/service/status.js";

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

const parseAppMeta = (appId) => {
  const serverDoc = path.join(ROOT_DIR, "server", "apps", appId, "APP.md");
  const frontendDir = path.join(ROOT_DIR, "gui", "src", "apps", appId);
  const backendDir = path.join(ROOT_DIR, "server", "apps", appId);
  const meta = {
    id: appId,
    title: appId,
    description: "",
    backend: existsSync(backendDir) ? path.relative(ROOT_DIR, backendDir) : "",
    frontend: existsSync(frontendDir) ? path.relative(ROOT_DIR, frontendDir) : "",
    doc: existsSync(serverDoc) ? path.relative(ROOT_DIR, serverDoc) : ""
  };
  if (!existsSync(serverDoc)) return meta;

  const text = readFileSync(serverDoc, "utf8");
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

const listAppDocs = () => {
  const appsRoot = path.join(ROOT_DIR, "server", "apps");
  if (!existsSync(appsRoot)) return [];
  return readdirSync(appsRoot)
    .filter((name) => name !== "app_shared")
    .filter((name) => safeStat(path.join(appsRoot, name))?.isDirectory())
    .map(parseAppMeta)
    .sort((a, b) => a.id.localeCompare(b.id));
};

const listAppDbs = () => {
  const dir = path.join(ROOT_DIR, "database", "apps");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".db"))
    .sort();
};

const toUrlBase = (req) => `http://${req.headers.host}`;

const buildWelcomeData = async (req) => {
  const gitBranch = runGit(["branch", "--show-current"]);
  const gitCommit = runGit(["rev-parse", "--short", "HEAD"]);
  const gitDirty = runGit(["status", "--porcelain"]);
  const [claudeStatus, codexStatus] = await Promise.all([
    getClaudeStatus(),
    getCodexStatus()
  ]);

  const data = {
    name: "AIOS",
    generatedAt: new Date().toISOString(),
    root: ROOT_DIR,
    servers: {
      main: "http://127.0.0.1:9501",
      apps: "http://127.0.0.1:9502",
      currentAppsBase: toUrlBase(req)
    },
    git: {
      branch: gitBranch.ok ? gitBranch.stdout : "",
      commit: gitCommit.ok ? gitCommit.stdout : "",
      dirty: Boolean(gitDirty.stdout)
    },
    paths: {
      frontend: "gui/",
      frontendApps: "gui/src/apps/",
      mainServer: "server/main/",
      appsServer: "server/apps/",
      prompts: "server/main/prompt/",
      appDatabases: "database/apps/",
      systemDatabase: "database/aios.db",
      files: "files/"
    },
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
      }
    },
    docs: {
      coreInstruction: "server/main/prompt/INSTRUCTION.md",
      codingAgentsPrompt: "server/main/prompt/codingAgents.js",
      appDocs: listAppDocs()
    },
    developmentGuide: {
      architecture: [
        "gui/ is frontend source",
        "server/main/ is core backend",
        "server/apps/ is app backend",
        "database/aios.db is the system SQLite database",
        "database/apps/*.db are per-app SQLite databases",
        "files/ stores runtime files"
      ],
      recommendedReading: [
        "server/main/prompt/INSTRUCTION.md",
        "server/main/prompt/codingAgents.js",
        "server/apps/<app>/APP.md",
        "server/apps/<app>/",
        "gui/src/apps/<app>/"
      ],
      reload: {
        endpoint: "POST /api/system/reload/request",
        note: "Frontend changes usually require build=true. App backend changes require restartApps=true. server/main changes require restartServer=true."
      }
    },
    databases: {
      system: existsSync(path.join(ROOT_DIR, "database", "aios.db")) ? ["database/aios.db"] : [],
      apps: listAppDbs().map((name) => `database/apps/${name}`)
    }
  };
  return data;
};

const boolText = (value) => value ? "true" : "false";

const toMarkdown = (data) => {
  const appDocLines = data.docs.appDocs.length
    ? data.docs.appDocs.map((app) => `- ${app.id}: ${app.doc || "-"}${app.backend ? ` | backend: ${app.backend}` : ""}${app.frontend ? ` | frontend: ${app.frontend}` : ""}`)
    : ["- (no app docs found)"];

  const appDbLines = data.databases.apps.length
    ? data.databases.apps.map((file) => `- ${file}`)
    : ["- (no app db files yet)"];

  return `# AIOS Welcome

## Project
- name: ${data.name}
- root: ${data.root}
- generatedAt: ${data.generatedAt}
- main server: ${data.servers.main}
- apps server: ${data.servers.apps}
- current apps base: ${data.servers.currentAppsBase}

## Git
- branch: ${data.git.branch || "-"}
- commit: ${data.git.commit || "-"}
- dirty: ${boolText(data.git.dirty)}

## Architecture
- gui/: frontend source
- gui/src/apps/: app frontend source
- server/main/: core backend
- server/apps/: app backends
- server/main/prompt/: system prompt assembly
- database/aios.db: system SQLite
- database/apps/: per-app SQLite
- files/: runtime files

## Coding Agents
- claude-code: installed=${boolText(Boolean(data.codingAgents.claudeCode.installed))} version=${data.codingAgents.claudeCode.version || "-"} cliPath=${data.codingAgents.claudeCode.cliPath || "-"}
- codex: installed=${boolText(Boolean(data.codingAgents.codex.installed))} version=${data.codingAgents.codex.version || "-"} cliPath=${data.codingAgents.codex.cliPath || "-"}

## Coding Agent APIs
- Claude Code status: ${data.codingAgents.claudeCode.statusEndpoint}
- Claude Code conversations: ${data.codingAgents.claudeCode.conversationsEndpoint}
- Claude Code messages: ${data.codingAgents.claudeCode.messagesEndpoint}
- Claude Code send: ${data.codingAgents.claudeCode.sendEndpoint}
- Codex status: ${data.codingAgents.codex.statusEndpoint}
- Codex conversations: ${data.codingAgents.codex.conversationsEndpoint}
- Codex messages: ${data.codingAgents.codex.messagesEndpoint}
- Codex send: ${data.codingAgents.codex.sendEndpoint}

## Recommended Reading
- ${data.docs.coreInstruction}
- ${data.docs.codingAgentsPrompt}
${appDocLines.join("\n")}

## Development Guide
- Read server/main/prompt/INSTRUCTION.md first for AIOS rules.
- Read server/apps/<app>/APP.md before changing an app.
- Backend app code lives in server/apps/<app>/.
- Frontend app code lives in gui/src/apps/<app>/.
- Reload endpoint: ${data.developmentGuide.reload.endpoint}
- Reload note: ${data.developmentGuide.reload.note}

## Databases
- system:
${data.databases.system.length ? data.databases.system.map((file) => `  - ${file}`).join("\n") : "  - (missing)"}
- apps:
${appDbLines.map((line) => `  ${line}`).join("\n")}
`;
};

const handleWelcome = async (req, res, path) => {
  const data = await buildWelcomeData(req);
  if (path === "/welcome.json") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(data));
    return true;
  }
  if (path === "/welcome") {
    res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
    res.end(toMarkdown(data));
    return true;
  }
  return false;
};

export {
  handleWelcome
};
