export const truncateToolResult = (content, { enabled = true, maxChars = 12000 } = {}) => {
  const limit = Math.max(1000, Math.min(50000, Number(maxChars) || 12000));
  const text = String(content ?? '');
  if (!enabled || text.length <= limit) {
    return { content: text, truncated: false, originalLength: text.length };
  }

  const head = Math.floor(limit * 0.7);
  const tail = limit - head;
  const clipped = `${text.slice(0, head)}\n...[truncated ${text.length - limit} chars]...\n${text.slice(-tail)}`;
  return { content: clipped, truncated: true, originalLength: text.length };
};

const clampInt = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(num)));
};

export const normalizeChatOptions = (options = {}) => {
  return {
    maxRounds: clampInt(options.maxRounds, 1, 500, 50),
    enableToolResultTruncate: options.enableToolResultTruncate !== false,
    toolResultMaxChars: clampInt(options.toolResultMaxChars, 1000, 50000, 12000)
  };
};

export const normalizeAgentMessages = (messages = []) => {
  if (!Array.isArray(messages)) return [];
  const validRoles = new Set(['system', 'user', 'assistant', 'tool']);
  const out = [];

  for (const item of messages) {
    if (!item || typeof item !== 'object') continue;
    const role = String(item.role || '').trim();
    if (!validRoles.has(role)) continue;

    const normalized = { role };
    if (role === 'assistant' && Array.isArray(item.tool_calls)) {
      normalized.content = item.content == null ? null : String(item.content);
      normalized.tool_calls = item.tool_calls;
    } else {
      normalized.content = item.content == null ? '' : String(item.content);
    }

    if (role === 'tool' && item.tool_call_id) {
      normalized.tool_call_id = String(item.tool_call_id);
    }
    if (role === 'assistant' && item.name) normalized.name = String(item.name);
    if (role === 'tool' && item.name) normalized.name = String(item.name);
    out.push(normalized);
  }

  let firstNonSystem = out.findIndex((m) => m.role !== 'system');
  while (firstNonSystem >= 0 && out[firstNonSystem]?.role === 'tool') {
    out.splice(firstNonSystem, 1);
    firstNonSystem = out.findIndex((m) => m.role !== 'system');
  }

  return out;
};
