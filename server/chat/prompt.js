import { readFileSync } from 'fs';
import { join } from 'path';
import { countUnread } from '../api/notifications/list.js';

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

export const buildSystemPrompt = (
  appsCatalog = [],
  { enableFollowupSuggestions = true, chatContext = null, modelInfo = null } = {}
) => {
  const cwd = process.cwd();

  let prompt = getInstruction();

  const overview = getOverview();
  if (overview) {
    prompt += `\n\n## 记忆\n${overview}`;
  }

  prompt += `\n\n## 运行架构
AIOS 由两个独立 Node.js 进程组成：
- **主服务**（端口 9700）：WebSocket、AI 引擎、HTTP、核心数据库，入口 server/index.js
- **应用服务**（端口 9701）：所有 apps/ 下的应用 API，入口 apps/index.js
- **前端**：静态文件由主服务 serve，源码在 ui/src/，构建产物在 ui/dist/

两个服务独立启停，互不影响。主服务通过反向代理将 /apps/ 转发到应用服务。

应用如需调用 LLM，使用主服务提供的统一接口（无需关心 apiKey/model）：
\`\`\`js
const res = await fetch('http://localhost:9700/api/llm/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: '...' }] })
});
const { message } = await res.json(); // message.content 是回复文本
\`\`\`

## 环境
- 项目根目录：${cwd}
- 系统数据库：${cwd}/database/aios.db（SQLite，表：chats, messages, settings）
- 应用数据库：${cwd}/database/apps.db（SQLite，应用表如 notebook_notes）
- 记忆文件：${cwd}/library/overview.md`;

  if (modelInfo) {
    prompt += `\n\n## 当前模型配置
- 供应方：${modelInfo.provider || '-'}
- 模型：${modelInfo.model || '-'}
- 请求地址：${modelInfo.apiUrl || '-'}`;
  }

  if (Array.isArray(appsCatalog) && appsCatalog.length > 0) {
    const lines = appsCatalog.map((app, i) => {
      const summary = app.summary ? ` - ${app.summary}` : '';
      return `${i + 1}. ${app.id} | ${app.title}${summary}`;
    });
    prompt += `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。\n${lines.join('\n')}`;
  } else {
    prompt += `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。`;
  }

  if (chatContext?.currentSessionId || (Array.isArray(chatContext?.recentChats) && chatContext.recentChats.length)) {
    const currentSessionId = String(chatContext?.currentSessionId || '').trim();
    const recentChats = Array.isArray(chatContext?.recentChats) ? chatContext.recentChats : [];
    const recentLines = recentChats
      .slice(0, 3)
      .map((c, i) => `${i + 1}. ${c.title || '未命名'} ｜ ${String(c.description || '').slice(0, 100)}`);

    prompt += `\n\n## 会话上下文`;
    if (currentSessionId) {
      prompt += `\n- 当前会话ID：${currentSessionId}`;
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

  if (enableFollowupSuggestions) {
    prompt += `\n\n## 后续建议输出
在回答的最后追加一个建议标签，格式必须如下：
<suggestions>
1. 建议一
2. 建议二
3. 建议三
</suggestions>

要求：
- 必须给出 3 条与当前对话相关的后续追问建议。
- 建议应简短、具体、可直接提问。`;
  }

  return prompt;
};
