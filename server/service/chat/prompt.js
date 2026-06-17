// @ts-nocheck
import fs from "node:fs";
import path from "node:path";
import { getMemoryPromptContext } from "../memories/index.js";

const SKILLS_ROOT = path.resolve(process.cwd(), "skills");

const defaultInstruction = `你是 Agent Chat，一个本地 AI 助手。

你可以正常回答问题；当需要本地验证、查看文件系统、执行命令或处理开发工作时，可以使用 shell 工具。
只在确实有帮助时使用工具。使用 shell 后，简要说明结果，并保持最终回答清晰。`;

const memoryBlock = () => {
  const { must, star, storedCount } = getMemoryPromptContext();
  const lines = ["## 记忆"];
  if (must.length) {
    lines.push("- 下面包含必须阅读的记忆。请把它们作为重要用户上下文。");
    for (const item of must) {
      lines.push(`### must #${item.id}: ${item.title}`);
      if (item.description) lines.push(`描述：${item.description}`);
      if (item.body) lines.push(item.body);
    }
  } else {
    lines.push("- 必读记忆：无。");
  }
  if (star.length) {
    lines.push("- 星标记忆摘要。这里不包含完整正文；如有需要，用 shell 调用 /api/memories/get?id=ID 读取。");
    for (const item of star) lines.push(`- star #${item.id}: ${item.title}${item.description ? ` - ${item.description}` : ""}`);
  } else {
    lines.push("- 星标记忆：无。");
  }
  lines.push(`- 未放入提示词的普通记忆数量：${storedCount}。`);
  lines.push("- 搜索记忆时，用 shell 发起 GET http://127.0.0.1:9500/api/memories/search?q=QUERY。");
  lines.push("- 读取完整记忆时，用 shell 发起 GET http://127.0.0.1:9500/api/memories/get?id=ID。");
  return lines.join("\n");
};

const controlsBlock = () => [
  "## 控制",
  "- 控制是连接器状态资源，不是额外的 AI 工具。",
  "- 控制只有两个：browser 和 computer。",
  "- Browser 表示 browser-use 连接器。Computer 表示 computer-use 连接器。",
  "- 只能通过 shell 工具访问 HTTP API 来检查控制状态。",
  "- 控制状态：GET http://127.0.0.1:9500/api/controls。",
  "- 调用 computer-use：向 http://127.0.0.1:9500/api/controls/computer/call POST JSON，包含 tool 和 args。",
  "- 调用 browser-use：向 http://127.0.0.1:9500/api/controls/browser/call POST JSON，包含 tool 和 args（如 browser_open / browser_read / browser_click / browser_fill / browser_screenshot）。",
  "- browser-use 由 Chrome 扩展执行；未连接时调用会返回错误，请先用 GET /api/controls 确认 browser.connected。",
  "- 可用的 computer-use / browser-use 能力由 GET /api/controls 返回。不要把它们当作 shell 执行。",
].join("\n");

const parseSkillFrontmatter = (content) => {
  if (!content.startsWith("---")) return {};
  const end = content.indexOf("\n---", 3);
  if (end < 0) return {};
  const meta = {};
  for (const line of content.slice(3, end).split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) meta[key] = value;
  }
  return meta;
};

const listLocalSkillSummaries = () => {
  try {
    const entries = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const file = path.join(SKILLS_ROOT, entry.name, "SKILL.md");
        try {
          const content = fs.readFileSync(file, "utf8");
          const meta = parseSkillFrontmatter(content);
          const [firstLine, ...rest] = content.split(/\r?\n/);
          const name = meta.name || (firstLine?.startsWith("#") ? firstLine.replace(/^#+\s*/, "").trim() : entry.name);
          const description = meta.description || rest.find((line) => line.trim() && !line.startsWith("#") && line.trim() !== "---")?.trim() || "";
          return { id: entry.name, name: name || entry.name, description, path: file };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
};

const skillsBlock = () => {
  const skills = listLocalSkillSummaries();
  const lines = [
    "## 技能",
    "- 技能是存放在 skills/*/SKILL.md 的本地能力说明，和记忆不同。",
    "- 系统会在这里提供当前可用技能摘要，按技能说明处理对应工作。",
    "- 判断某个技能适用时，先按摘要执行；如果需要完整说明，可用 shell 读取对应 SKILL.md 文件。",
  ];
  if (!skills.length) {
    lines.push("- 当前没有本地技能。");
    return lines.join("\n");
  }
  lines.push("- 当前本地技能：");
  for (const skill of skills) {
    lines.push(`  - ${skill.id}：${skill.name}${skill.description ? ` - ${skill.description}` : ""}（${skill.path}）`);
  }
  return lines.join("\n");
};

const appsBlock = () => [
  "## 应用",
  "- 应用是独立的本地应用，不是内置 AI 工具。",
  "- 主服务会处理 http://127.0.0.1:9500/apps/* 下的应用请求。",
  "- 应用服务健康检查：GET http://127.0.0.1:9500/apps/health。",
  "- 当前应用源码位于 server/apps/<app>、ui/apps/<app> 和 apps/<app>/APP.md。",
  "- 应用 SQLite 数据库位于 data/apps/。",
  "- 需要检查或操作应用 API 时，使用 shell/curl。",
].join("\n");

const buildSystemPrompt = (chatId, _contextMessages = [], settings = {}) => {
  const instruction = String(settings.system || "").trim() || defaultInstruction;
  return [
    instruction,
    "## 运行环境",
    `- 当前 chatId：${chatId}`,
    `- 工作目录：${process.cwd()}`,
    `- 模型：${settings.model || ""}`,
    "## 工具",
    "- shell(command, summary, timeout?, cwd?)：执行 shell 命令并返回 stdout/stderr。",
    "- 本地文件、代码、测试、安装、构建和命令行任务使用 shell。",
    "- 纯对话场景直接回答，不要使用工具。",
    "",
    memoryBlock(),
    "",
    skillsBlock(),
    "",
    "## 后台任务",
    "- 任务是后台工作，不是普通聊天消息。",
    "- 只有在工作较慢、可并行或需要稍后回报时才创建任务。",
    "- 短回答、轻量检查或普通对话不要创建任务。",
    "- 创建任务时，用 shell 向 http://127.0.0.1:9500/api/tasks POST JSON。",
    `- 如果任务结果需要回到当前聊天，请包含 {"subscription":{"chatId":"${chatId}"}}。`,
    "",
    appsBlock(),
    "",
    controlsBlock(),
  ].filter((part) => String(part ?? "").trim()).join("\n\n");
};

export { buildSystemPrompt };
