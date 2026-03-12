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
import { tools as toolsSection } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSTRUCTION_PATH = join(__dirname, 'INSTRUCTION.md');
const MEMORY_INDEX_PATH = join(process.cwd(), 'memory', 'index.md');

const instruction = () => {
  try {
    // 基础总提示词：来自 INSTRUCTION.md，是整个 system prompt 的主干。
    return readFileSync(INSTRUCTION_PATH, 'utf8').trim();
  } catch {
    return '你是 AIOS。';
  }
};

const memoryIndexOverview = () => {
  try {
    // 只注入 memory/index.md 的索引概览，不把所有记忆文件一次性塞进上下文。
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

  // 最终 system prompt 的拼接顺序如下：
  // 1. INSTRUCTION.md：全局身份、风格、硬规则
  // 2. language：当前回复语言偏好
  // 3. memory：记忆索引概览（不是全量记忆内容）
  // 4. environment：项目路径、数据库、文件目录等运行环境
  // 5. model：当前模型/供应商/API 配置摘要
  // 6. tools：工具截断、循环轮数等工具规则
  // 7. apps：当前系统内置应用与使用约束
  // 8. chats：当前会话相关上下文约束
  let prompt = instruction();

  // 语言段：告诉模型当前应优先使用哪种语言回复。
  prompt += languageSection(language);

  // 记忆段：只给记忆索引，让模型自行判断是否需要再去读具体记忆文件。
  prompt += memorySection(memoryIndexOverview());

  // 环境段：把 cwd、数据库位置、文件目录等系统事实注入进去。
  prompt += environmentSection(cwd);

  // 模型段：补充 provider / model / apiUrl，便于提示词按当前模型特性约束输出。
  prompt += modelSection({ provider, name: model, apiUrl });

  // 工具段：说明工具结果截断、最大轮数等 agent 执行边界。
  prompt += toolsSection({
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  });

  // 应用段：告诉模型当前系统有哪些应用，以及应用层的协作规则。
  prompt += appsSection();

  // 会话段：把当前 conversation 的上下文约束拼到最后。
  prompt += chatsSection(currentConversationId);

  return prompt;
};
