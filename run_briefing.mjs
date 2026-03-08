import { createAgentTask } from './server/api/task/create/agent.js';

const date = new Date().toISOString().slice(0, 10);
const focus = 'ai 大模型动态';

const prompt = [
  '你在处理 briefing 的今日新闻简报生成请求。',
  '你可以自行使用 shell 搜索和阅读网页，再整理结果。',
  '最终只输出 JSON，不要输出任何其它文字。',
  'JSON 格式必须是：{"title":"...","brief":"...","content":"...","note":"..."}。',
  '其中 content 建议使用多段列表，包含要点列表。',
  `日期：${date}`,
  `用户关注方向：${focus}`,
  '当前 note：'
].join('\n');

const result = await createAgentTask({
  app: 'briefing',
  title: `简报刷新 ${date}`,
  prompt: prompt
});

console.log('Task ID:', result.id);
console.log('Conversation ID:', result.conversationId);
