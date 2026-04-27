import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { getSettings } from "../service/settings/get.js";
import { apps as appsSection } from "./apps.js";
import { chats as chatsSection } from "./chats.js";
import { codingAgents as codingAgentsSection } from "./codingAgents.js";
import { environment as environmentSection } from "./environment.js";
import { language as languageSection } from "./language.js";
import { memory as memorySection } from "./memory.js";
import { model as modelSection } from "./model.js";
import { skills as skillsSection } from "./skills.js";
import { tools as toolsSection } from "./tools.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
// 仓库根的 AGENTS.md 是 scripts/start.mjs 按当前 locale 烘焙的产物，
// 源在 language/zh/AGENTS.md / language/en/AGENTS.md。
// 运行时不再按 language 分支返回不同字符串——烘焙过的 AGENTS.md 已经是当前 locale 的版本。
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const AGENTS_PATH = join(REPO_ROOT, "AGENTS.md");
const instruction = () => {
  try {
    return readFileSync(AGENTS_PATH, "utf8").trim();
  } catch {
    return "你是 AIOS。";
  }
};
const buildSystemPrompt = (currentConversationId = "") => {
  const settings = getSettings();
  const {
    apiUrl,
    model,
    provider,
    language,
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  } = settings;
  const cwd = process.cwd();
  let prompt = instruction();
  prompt += languageSection(language);
  prompt += memorySection();
  prompt += environmentSection(cwd);
  prompt += modelSection({ provider, name: model, apiUrl });
  prompt += toolsSection({
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  });
  prompt += appsSection(language);
  prompt += codingAgentsSection();
  prompt += skillsSection();
  prompt += chatsSection(currentConversationId);
  return prompt;
};
export {
  buildSystemPrompt
};
