// @ts-nocheck
// 工具调用循环。
// 与 1-agent 对齐:不对历史消息做加工,传入什么就发给模型;模型返回的
// assistant / tool 消息也原样塞回 workMessages,继续下一轮。
import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLlmStream } from "./llm.js";

const chat = async (messages, {
  apiUrl,
  apiKey,
  model,
  onEvent = () => {},
  signal,
  responseFormat = null,
  beforeModelCall = null,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000
} = {}) => {
  const workMessages = Array.isArray(messages) ? [...messages] : [];
  let round = 0;
  let lastUsage = null;

  while (true) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (beforeModelCall) {
      const nextMessages = await beforeModelCall({ messages: workMessages, lastUsage, round: ++round });
      if (Array.isArray(nextMessages)) {
        workMessages.length = 0;
        workMessages.push(...nextMessages);
      }
    } else {
      round += 1;
    }
    const payload = { model, messages: workMessages, tools };
    if (responseFormat) payload.response_format = responseFormat;

    const result = await callLlmStream(apiUrl, apiKey, payload, {
      signal,
      onMessage: (content) => onEvent({ type: "message", content }),
    });
    const message = result.message;
    if (result.usage) {
      lastUsage = result.usage;
      onEvent({ type: "usage", usage: result.usage });
    }

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      workMessages.push(message);
      onEvent({ type: "tool_calls", message, usage: result.usage || null });
      const toolMessages = await runTools(message.tool_calls, { signal, enableToolResultTruncate, toolResultMaxChars });
      for (const toolMessage of toolMessages) {
        workMessages.push(toolMessage);
      }
      onEvent({ type: "tool_results", messages: toolMessages });
      continue;
    }

    const text = message.content ?? "";
    workMessages.push(message);
    onEvent({ type: "done", message, text, usage: result.usage || null });
    return { text, messages: workMessages };
  }
};

export { chat };
