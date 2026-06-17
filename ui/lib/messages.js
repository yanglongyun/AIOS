import { t } from './locale.js';

export const mkKey = (kind) => `ws:${Date.now()}:${Math.random().toString(36).slice(2)}:${kind}`;

const parseToolArgs = (raw) => {
  if (typeof raw !== 'string') return null;
  try { return JSON.parse(raw); } catch { return null; }
};

export const mapToolCall = (toolCall, _key) => {
  const name = toolCall?.function?.name || '';
  const args = parseToolArgs(toolCall?.function?.arguments);
  const toolCallId = String(toolCall?.id || '');
  if (name === 'shell' && args) {
    return {
      type: 'tool_call',
      toolCallId,
      shell: true,
      toolCall,
      title: args.summary || args.reason || 'shell',
      command: args.command || '',
      expanded: false,
      _key
    };
  }
  return {
    type: 'tool_call',
    toolCallId,
    toolCall,
    title: name || t('chat_tool_call', '工具调用'),
    detail: args ? JSON.stringify(args, null, 2) : '',
    expanded: false,
    _key
  };
};

export const fillToolCallResult = (list, result) => {
  const id = String(result?.toolCallId || result?.tool_call_id || '');
  const content = result?.content ?? '';
  const item = [...list].reverse().find((entry) => entry.type === 'tool_call' && entry.toolCallId && entry.toolCallId === id)
    || [...list].reverse().find((entry) => entry.type === 'tool_call' && !entry.result);
  if (item) item.result = typeof content === 'string' ? content : JSON.stringify(content);
};

export const parseMessages = (raw = []) => {
  const list = [];
  for (const row of raw) {
    const m = row?.message && typeof row.message === 'object' ? row.message : row;
    if (!m || m.role === 'system') continue;
    const base = row?.id != null ? `db:${row.id}` : null;
    const attachments = Array.isArray(row?.meta?.attachments)
      ? row.meta.attachments
      : [];

    if (m.role === 'assistant' && m.tool_calls?.length) {
      if (m.content) {
        list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:assistant` : undefined });
      }
      m.tool_calls.forEach((tc, i) => {
        list.push(mapToolCall(tc, base ? `${base}:tool_call:${i}` : undefined));
      });
      continue;
    }

    if (m.role === 'tool') {
      fillToolCallResult(list, { toolCallId: m.tool_call_id, content: m.content });
      continue;
    }

    if (m.role === 'assistant' && m.content) {
      list.push({ role: 'assistant', content: m.content, _key: base ? `${base}:assistant` : undefined });
      continue;
    }

    const kind = row?.meta?.kind || (row?.meta?.source === 'subscription' ? 'task' : 'message');
    if (kind === 'task' && (m.content || attachments.length)) {
      list.push({ role: 'task', kind, content: m.content || '', attachments, meta: row?.meta || null, expanded: false, _key: base ? `${base}:task` : undefined });
      continue;
    }

    if (kind === 'compaction' && (m.content || attachments.length)) {
      list.push({ role: 'compaction', kind, content: m.content || '', attachments, meta: row?.meta || null, expanded: false, _key: base ? `${base}:compaction` : undefined });
      continue;
    }

    if (m.role === 'user' && (m.content || attachments.length)) {
      list.push({ role: 'user', kind, content: m.content || '', attachments, meta: row?.meta || null, _key: base ? `${base}:user` : undefined });
    }
  }
  return list;
};
