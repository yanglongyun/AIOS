import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getSettings } from '../../service/settings/get.js';
import { apps as appsSection } from './apps.js';
import { chats as chatsSection } from './chats.js';
import { environment as environmentSection } from './environment.js';
import { language as languageSection } from './language.js';
import { memory as memorySection } from './memory.js';
import { model as modelSection } from './model.js';
import { notifications as notificationsSection } from './notifications.js';
import { scripts as scriptsSection } from './scripts.js';
import { tools as toolsSection } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSTRUCTION_PATH = join(__dirname, 'INSTRUCTION.md');
const MEMORY_INDEX_PATH = join(process.cwd(), 'memory', 'index.md');

const instruction = () => {
  try {
    return readFileSync(INSTRUCTION_PATH, 'utf8').trim();
  } catch {
    return '你是 AIOS。';
  }
};

const memoryIndexOverview = () => {
  try {
    return readFileSync(MEMORY_INDEX_PATH, 'utf8').trim();
  } catch {
    return null;
  }
};

export const buildSystemPrompt = (currentConversationId = '') => {
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
  prompt += memorySection(memoryIndexOverview());
  prompt += environmentSection(cwd);
  prompt += modelSection({ provider, name: model, apiUrl });
  prompt += toolsSection({
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  });
  prompt += appsSection();
  prompt += scriptsSection();
  prompt += chatsSection(currentConversationId);
  prompt += notificationsSection();

  return prompt;
};
