import { callLlmChat } from '../../app_shared/chatLlm.js';

const normalizeSuggestions = (list = []) => {
  const out = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (item && typeof item === 'object') {
      const title = String(item.title || '').trim();
      const content = String(item.content || '').trim();
      if (title && content) out.push({ title, content });
    } else {
      const text = String(item || '').trim();
      if (text) out.push({ title: `建议 ${out.length + 1}`, content: text });
    }
    if (out.length >= 3) break;
  }
  while (out.length < 3) {
    const idx = out.length + 1;
    out.push({
      title: `建议 ${idx}`,
      content: `我想强调第 ${idx} 点：我们会给出可执行、可验证、可负担的方案。`
    });
  }
  return out;
};

const parseSuggestionsContent = (raw = '') => {
  const text = String(raw || '').trim();
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.suggestions)) return parsed.suggestions;
  } catch {}

  const lineItems = text
    .split('\n')
    .map((line) => line.replace(/^[\s\-*0-9.、)\](]+/, '').trim())
    .filter(Boolean);
  return lineItems;
};

export const suggestHandler = async (body = {}, req) => {
  const topicInfo = String(body.topicInfo || '').trim();
  const draft = String(body.draft || '').trim();
  if (!topicInfo) return { status: 400, message: '缺少 topicInfo' };

  const messages = [
    {
      role: 'system',
      content: `你是竞选辩论助理，目标是帮助候选人赢得辩论。
你只输出 JSON，格式为 {"suggestions":[{"title":"标题1","content":"发言内容1"},{"title":"标题2","content":"发言内容2"},{"title":"标题3","content":"发言内容3"}]}。
要求：
1) 必须恰好 3 条；
2) title 6-12 个中文字符，便于按钮展示；
3) content 是可直接复制发言（1-2句）；
4) 内容要避免重复，优先可执行、能拉升支持率；
5) 只返回 JSON，不要额外说明。`
    },
    {
      role: 'user',
      content: `辩论上下文：\n${topicInfo}\n\n用户草稿（可为空）：\n${draft || '(无)'}`
    }
  ];

  const llm = await callLlmChat(req, { messages });
  if (!llm.ok) return { suggestions: normalizeSuggestions([]) };
  const raw = String(llm.data?.message?.content || '').trim();
  return { suggestions: normalizeSuggestions(parseSuggestionsContent(raw)) };
};

