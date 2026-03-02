import { tools as defaultTools } from './tools.js';
import { runTools } from './runner.js';
import { callLLM } from './llm.js';

const MAX_ROUNDS = 20;

const trimMessages = (messages, contextRounds) => {
  if (!contextRounds || messages.length <= contextRounds + 1) return messages;
  let cutIndex = messages.length - contextRounds;
  if (cutIndex > 1 && messages[cutIndex].role === 'tool') cutIndex--;
  return [messages[0], ...messages.slice(cutIndex)];
};

export const chat = async (messages, { model, contextRounds, apiUrl, apiKey, provider, tools = defaultTools, send = () => {}, signal } = {}) => {
  let round = 0;

  while (round++ < MAX_ROUNDS) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const trimmed = trimMessages(messages, contextRounds);
    const payload = { model, messages: trimmed };
    if (tools) payload.tools = tools;
    const message = await callLLM(provider, apiUrl, apiKey, payload, signal);

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      messages.push(assistantMsg);

      const parsed = message.tool_calls.map(tc => JSON.parse(tc.function.arguments || '{}'));
      for (const { command, reason } of parsed) {
        send({ type: 'tool_call', command, reason });
      }

      const toolMessages = await runTools(message.tool_calls);
      for (let i = 0; i < toolMessages.length; i++) {
        const tm = toolMessages[i];
        tm._meta = { command: parsed[i]?.command, reason: parsed[i]?.reason, status: 'executed' };
        messages.push(tm);
        send({ type: 'tool_result', content: tm.content, _meta: tm._meta });
      }

      continue;
    }

    const text = message.content ?? '';
    const replyMsg = { role: 'assistant', content: text };
    messages.push(replyMsg);
    send({ type: 'reply', content: text });
    return text;
  }

  send({ type: 'reply', content: '(达到最大轮次限制)' });
  return '(达到最大轮次限制)';
};
