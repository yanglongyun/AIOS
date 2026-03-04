import { readFileSync } from 'fs';
import { join } from 'path';
import { countUnread } from '../api/notifications/list.js';
import { getSettings } from '../db/settings.js';
import { getAppsCatalog } from './apps.js';
import { getRecentChats } from './chats.js';

const INSTRUCTION_PATH = join(process.cwd(), 'instruction.md');

const getInstruction = () => {
  try {
    return readFileSync(INSTRUCTION_PATH, 'utf8').trim();
  } catch {
    return '你是 AIOS。';
  }
};

const getOverview = () => {
  try {
    return readFileSync(join(process.cwd(), 'library/overview.md'), 'utf8').trim();
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
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  } = settings;
  const appsCatalog = getAppsCatalog();
  const recentChats = getRecentChats();
  const cwd = process.cwd();

  let prompt = getInstruction();

  const overview = getOverview();
  if (overview) {
    prompt += `\n\n## 记忆\n${overview}`;
  }

  prompt += `\n\n## 环境
- 项目根目录：${cwd}
- 系统数据库：${cwd}/database/aios.db（SQLite，表：chats, messages, settings）
- 应用数据库目录：${cwd}/database/apps/（SQLite，每个应用独立 db 文件）
- 文件系统目录：${cwd}/files/
- 上传目录：${cwd}/files/uploads/
- 下载目录：${cwd}/files/downloads/
- 记忆文件：${cwd}/library/overview.md`;

  prompt += `\n\n## 当前模型配置
- 供应方：${provider || '-'}
- 模型：${model || '-'}
- 请求地址：${apiUrl || '-'}`;

  prompt += `\n\n## 工具配置
- 工具结果截断：${enableToolResultTruncate ? '开启' : '关闭'}
- 工具结果最大长度：${toolResultMaxChars ?? '-'}
- 工具循环限制：${enableToolLoopLimit ? '开启' : '关闭'}
- 工具最大循环轮次：${toolMaxRounds ?? '-'}`;

  if (Array.isArray(appsCatalog) && appsCatalog.length > 0) {
    const lines = appsCatalog.map((app, i) => {
      const summary = app.summary ? ` - ${app.summary}` : '';
      return `${i + 1}. ${app.id} | ${app.title}${summary}`;
    });
    prompt += `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。\n${lines.join('\n')}`;
  } else {
    prompt += `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。`;
  }

  const currentId = String(currentConversationId || '').trim();
  if (currentId || (Array.isArray(recentChats) && recentChats.length)) {
    const recentLines = recentChats
      .slice(0, 3)
      .map((c, i) => `${i + 1}. ${c.title || '未命名'} ｜ ${String(c.description || '').slice(0, 100)}`);

    prompt += `\n\n## 会话上下文`;
    if (currentId) {
      prompt += `\n- 当前会话ID：${currentId}`;
    }
    if (recentLines.length) {
      prompt += `\n- 最近 3 次会话（标题｜描述前100字）：\n${recentLines.join('\n')}`;
    }
  }

  const unread = countUnread();
  if (unread > 0) {
    prompt += `\n\n## 通知
你有 ${unread} 条未读通知。可以用 shell 执行 \`curl http://localhost:9700/api/notifications\` 查看详情，用 \`curl -X POST http://localhost:9700/api/notifications/read -H 'Content-Type: application/json' -d '{"id":通知ID,"reply":"处理说明"}'\` 标记已读。`;
  }

  return prompt;
};
