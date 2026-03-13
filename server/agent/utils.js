import { getInternalApiToken } from '../../shared/auth/repository.js';

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

  // 第一步：标准化每条消息
  const normalized = [];
  for (const item of messages) {
    if (!item || typeof item !== 'object') continue;
    const role = String(item.role || '').trim();
    if (!validRoles.has(role)) continue;

    const msg = { role };
    if (role === 'assistant' && Array.isArray(item.tool_calls)) {
      msg.content = item.content == null ? null : String(item.content);
      msg.tool_calls = item.tool_calls;
    } else {
      msg.content = item.content == null ? '' : String(item.content);
    }

    if (role === 'tool' && item.tool_call_id) {
      msg.tool_call_id = String(item.tool_call_id);
    }
    if (role === 'assistant' && item.name) msg.name = String(item.name);
    if (role === 'tool' && item.name) msg.name = String(item.name);
    normalized.push(msg);
  }

  // 第二步：收集所有 tool 回复到 map，按 tool_call_id 索引
  const toolMap = new Map();
  for (const msg of normalized) {
    if (msg.role === 'tool' && msg.tool_call_id) {
      toolMap.set(msg.tool_call_id, msg);
    }
  }

  const TOOL_MISSING = '工具调用未返回结果：可能因系统中断、服务重启、超时或其它未知原因，导致本次执行结果未被记录。';

  // 第三步：重建消息序列，确保每个 assistant+tool_calls 后紧跟对应 tool 回复
  const out = [];
  for (const msg of normalized) {
    if (msg.role === 'tool') continue; // tool 消息由 assistant 驱动插入

    out.push(msg);

    if (msg.role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        const tcId = String(tc?.id || '').trim();
        if (!tcId) continue;
        const toolMsg = toolMap.get(tcId);
        if (toolMsg) {
          out.push(toolMsg);
          toolMap.delete(tcId);
        } else {
          out.push({ role: 'tool', tool_call_id: tcId, content: TOOL_MISSING });
        }
      }
    }
  }

  // 第四步：移除开头孤立的 tool 消息（system 后不能直接跟 tool）
  let firstNonSystem = out.findIndex((m) => m.role !== 'system');
  while (firstNonSystem >= 0 && out[firstNonSystem]?.role === 'tool') {
    out.splice(firstNonSystem, 1);
    firstNonSystem = out.findIndex((m) => m.role !== 'system');
  }

  return out;
};

const RUNTIME_TOKEN_PLACEHOLDER = '<INTERNAL_TOKEN_BY_RUNTIME>';
const LOCAL_API_CURL_RE = /^\s*curl\b[\s\S]*https?:\/\/(?:127\.0\.0\.1|localhost):9700\/api\/\S+/i;
const DANGEROUS_CHAIN_RE = /(?:&&|\|\||;|`|\$\()/;

const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readInternalToken = () => {
  return String(getInternalApiToken() || '').trim();
};

export const prepareShellCommand = (command) => {
  const raw = String(command || '');
  if (!raw.includes(RUNTIME_TOKEN_PLACEHOLDER)) {
    return { command: raw, secrets: [] };
  }

  if (DANGEROUS_CHAIN_RE.test(raw)) {
    throw new Error('检测到危险命令拼接，拒绝替换内部令牌');
  }
  if (!LOCAL_API_CURL_RE.test(raw)) {
    throw new Error('内部令牌仅允许用于本地 API curl 命令');
  }

  const token = readInternalToken();
  if (!token) {
    throw new Error('系统内部令牌不存在，请先完成一次登录');
  }
  return {
    command: raw.split(RUNTIME_TOKEN_PLACEHOLDER).join(token),
    secrets: [token]
  };
};

export const maskSensitiveInText = (text, secrets = []) => {
  const source = String(text || '');
  if (!Array.isArray(secrets) || secrets.length === 0) return source;

  let masked = source;
  for (const secret of secrets) {
    const value = String(secret || '').trim();
    if (!value) continue;
    masked = masked.replace(new RegExp(escapeRegExp(value), 'g'), '***');
  }
  return masked;
};
