import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { getSettings } from "../service/settings/get.js";
import { apps as appsSection } from "./apps.js";
import { chats as chatsSection } from "./chats.js";
import { codingAgents as codingAgentsSection } from "./codingAgents.js";
import { environment as environmentSection } from "./environment.js";
import { memory as memorySection } from "./memory.js";
import { model as modelSection } from "./model.js";
import { skills as skillsSection } from "./skills.js";
import { tools as toolsSection } from "./tools.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
// Root AGENTS.md is baked by scripts/start.mjs from the active locale.
// Sources live in language/zh/AGENTS.md and language/en/AGENTS.md.
// Runtime reads the already-baked AGENTS.md instead of branching by locale here.
const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const AGENTS_PATH = join(REPO_ROOT, "AGENTS.md");
const instruction = () => {
  try {
    return readFileSync(AGENTS_PATH, "utf8").trim();
  } catch {
    return "You are AIOS.";
  }
};
const buildSystemPrompt = (currentConversationId = "") => {
  const settings = getSettings();
  const {
    apiUrl,
    model,
    provider,
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  } = settings;
  const cwd = process.cwd();
  let prompt = instruction();
  prompt += memorySection();
  prompt += environmentSection(cwd);
  prompt += modelSection({ provider, name: model, apiUrl });
  prompt += toolsSection({
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  });
  prompt += appsSection();
  prompt += codingAgentsSection();
  prompt += skillsSection();
  prompt += chatsSection(currentConversationId);
  return prompt;
};
export {
  buildSystemPrompt
};
