import { tools } from './tools.js';
import { runTools } from './runner.js';
import { callLLM } from './llm.js';
import { normalizeAgentMessages, normalizeChatOptions } from './utils.js';

// Agent 主循环：
// 1) 调用模型
// 2) 若返回 tool_calls 则执行工具并把结果回填到消息栈，继续下一轮
// 3) 若返回普通回复则直接结束
export const chat = async (messages, {
  provider,
  apiUrl,
  apiKey,
  model,
  send = () => { },
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000
} = {}) => {
  // 规范化运行配置（轮次上限、工具结果截断开关和长度）
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });

  // 规范化输入消息，确保 role/content/tool_call_id 结构符合模型接口要求
  const workMessages = normalizeAgentMessages(messages);
  let round = 0;

  while (round++ < opts.maxRounds) {
    // 每轮开始先检查中止信号，支持外部终止任务
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    // 把当前消息栈和工具定义发给模型
    const payload = { model, messages: workMessages, tools };
    const message = await callLLM(provider, apiUrl, apiKey, payload, signal);

    // 工具分支：模型返回 tool_calls，需要先执行工具再继续下一轮
    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      // 先把 assistant 的 tool_calls 消息入栈，作为后续 tool 消息的上文
      const assistantMsg = {
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      workMessages.push(assistantMsg);

      // 通知外部：逐条工具调用（用于 UI 展示）
      for (const toolCall of message.tool_calls) {
        send({ type: 'tool_call', toolCall });
      }

      // 执行工具；截断在 runner 内部统一处理
      const toolMessages = await runTools(message.tool_calls, {
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });

      // 把每条 tool 结果写回消息栈，并通知外部
      for (const tm of toolMessages) {
        workMessages.push(tm);
        send({ type: 'tool_result', message: tm });
      }

      // 本轮结束，带着新的 tool 结果进入下一轮模型调用
      continue;
    }

    // 非工具调用分支：模型已给出最终回复，本次 chat 直接结束
    // 这里不需要再 push 到 workMessages，因为下面会立即 return
    const text = message.content ?? '';
    const replyMsg = { role: 'assistant', content: text };
    send({ type: 'assistant', message: replyMsg });
    return text;
  }

  // 超过最大轮次仍未得到最终回复，返回兜底文案
  send({ type: 'assistant', message: { role: 'assistant', content: '(达到最大轮次限制)' } });
  return '(达到最大轮次限制)';
};
