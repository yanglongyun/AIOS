// @ts-nocheck
import { DEFAULT_SYSTEM_PROMPT } from "./default.js";
import { environment as environmentSection } from "./environment.js";
import { model as modelSection } from "./model.js";
import { tools as toolsSection } from "./tools.js";
import { apps as appsSection } from "./apps.js";
import { chats as chatsSection } from "./chats.js";

const instruction = (settings = {}) =>
  String(settings.system || "").trim() || DEFAULT_SYSTEM_PROMPT;

const buildSystemPrompt = (chatId, contextMessages = [], settings = {}) => {
  let prompt = instruction(settings);
  prompt += environmentSection(process.cwd());
  prompt += modelSection({
    name: settings.model,
    apiUrl: settings.apiUrl,
  });
  prompt += toolsSection({
    enableToolResultTruncate: settings.enableToolResultTruncate,
    toolResultMaxChars: settings.toolResultMaxChars,
    enableToolLoopLimit: settings.enableToolLoopLimit,
    toolMaxRounds: settings.toolMaxRounds,
  });
  prompt += appsSection();
  prompt += chatsSection(chatId, contextMessages);
  return prompt;
};

export { buildSystemPrompt };
