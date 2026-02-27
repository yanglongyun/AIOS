import { tools } from './tools.js';
import { runTools } from './runner.js';
import { callLLM } from './llm.js';

const MAX_ROUNDS = 20;

const trimMessages = (messages, contextRounds) => {
  if (!contextRounds || messages.length <= contextRounds + 1) return messages;
  let cutIndex = messages.length - contextRounds;
  // tool 前面必须有 assistant(tool_calls)，往前补一条
  if (cutIndex > 1 && messages[cutIndex].role === 'tool') cutIndex--;
  return [messages[0], ...messages.slice(cutIndex)];
};

export const chat = async (chatId, messages, send, { model, contextRounds, apiUrl, apiKey, mode, waitForApproval, saveMessage }) => {
  let round = 0;

  while (round++ < MAX_ROUNDS) {
    const trimmed = trimMessages(messages, contextRounds);
    const message = await callLLM({ messages: trimmed, tools, model, apiUrl, apiKey });

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      messages.push(assistantMsg);
      saveMessage(chatId, assistantMsg);

      // 解析参数
      const parsed = message.tool_calls.map(tc => JSON.parse(tc.function.arguments || '{}'));

      // ask 模式：发确认请求，等用户批准
      if (mode === 'ask') {
        for (let i = 0; i < message.tool_calls.length; i++) {
          const { command, reason } = parsed[i];
          send({ type: 'tool_confirm', id: message.tool_calls[i].id, command, reason });
        }

        const approved = await waitForApproval();
        send({ type: 'tool_approved', approved });

        if (!approved) {
          // 用户拒绝，返回拒绝结果给 LLM
          const toolMessages = message.tool_calls.map(tc => ({
            role: 'tool',
            tool_call_id: tc.id,
            content: '用户拒绝执行此命令'
          }));
          for (const tm of toolMessages) {
            messages.push(tm);
            saveMessage(chatId, tm, { status: 'rejected', ...parsed[0] });
          }
          continue;
        }
      }

      // auto 模式：发送 tool_call 卡片（ask 模式已有 confirm 卡片，不重复）
      if (mode !== 'ask') {
        for (const { command, reason } of parsed) {
          send({ type: 'tool_call', command, reason });
        }
      }

      const toolMessages = await runTools(message.tool_calls);

      for (let i = 0; i < toolMessages.length; i++) {
        const tm = toolMessages[i];
        const meta = { command: parsed[i]?.command, reason: parsed[i]?.reason, status: 'executed' };
        messages.push(tm);
        saveMessage(chatId, tm, meta);
        send({ type: 'tool_result', content: tm.content });
      }

      continue;
    }

    const text = message.content ?? '';
    const replyMsg = { role: 'assistant', content: text };
    messages.push(replyMsg);
    saveMessage(chatId, replyMsg);
    send({ type: 'reply', content: text });
    return text;
  }

  send({ type: 'reply', content: '(达到最大轮次限制)' });
  return '(达到最大轮次限制)';
};
