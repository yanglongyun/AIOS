import { tools } from './tools.js';
import { runTools } from './runner.js';
import { callLLM } from './llm.js';
import { normalizeAgentMessages, normalizeChatOptions, truncateToolResult } from './utils.js';

/**
 * send 协议：
 *   { type: 'assistant',    _message }           — assistant 消息（含 tool_calls），仅持久化
 *   { type: 'tool_call',    command, reason }     — 单个工具调用，仅 UI
 *   { type: 'tool_result',  content, _message, _meta } — 工具结果，UI + 持久化
 *   { type: 'reply',        content, _message }   — 最终回复，UI + 持久化
 */
export const chat = async (messages, {
  model,
  maxRounds = 50,
  apiUrl,
  apiKey,
  provider,
  send = () => {},
  signal,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages);
  let round = 0;

  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const payload = { model, messages: workMessages, tools };
    const message = await callLLM(provider, apiUrl, apiKey, payload, signal);

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      workMessages.push(assistantMsg);
      send({ type: 'assistant', _message: assistantMsg });

      const parsed = message.tool_calls.map(tc => JSON.parse(tc.function.arguments || '{}'));
      for (const { command, reason } of parsed) {
        send({ type: 'tool_call', command, reason });
      }

      const toolMessages = await runTools(message.tool_calls);
      for (let i = 0; i < toolMessages.length; i++) {
        const raw = toolMessages[i];
        const trimmed = truncateToolResult(raw.content, {
          enabled: opts.enableToolResultTruncate,
          maxChars: opts.toolResultMaxChars
        });
        const tm = { ...raw, content: trimmed.content };
        const meta = {
          command: parsed[i]?.command,
          reason: parsed[i]?.reason,
          status: 'executed',
          truncated: trimmed.truncated,
          originalLength: trimmed.originalLength
        };
        workMessages.push(tm);
        send({ type: 'tool_result', content: tm.content, _message: tm, _meta: meta });
      }

      continue;
    }

    const text = message.content ?? '';
    const replyMsg = { role: 'assistant', content: text };
    workMessages.push(replyMsg);
    send({ type: 'reply', content: text, _message: replyMsg });
    return text;
  }

  send({ type: 'reply', content: '(达到最大轮次限制)' });
  return '(达到最大轮次限制)';
};
