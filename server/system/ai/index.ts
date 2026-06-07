// @ts-nocheck
import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLlmStream } from "./llm/stream.js";
import {
  normalizeAgentMessages,
  normalizeChatOptions,
  shouldReplayReasoning,
} from "./utils.js";

const chat = async (messages, {
  apiUrl,
  apiKey,
  model,
  provider = "",
  onEvent = () => {},
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000,
  responseFormat = null
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages, { model, apiUrl });
  const replayReasoning = shouldReplayReasoning(model, apiUrl);
  let round = 0;

  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    // responseFormat(如任务强制 { type: "json_object" })只约束最终回答那一轮;
    // 需要调工具的中间轮 DeepSeek 仍正常返回 tool_calls(实测验证)。
    const payload = { model, messages: workMessages, tools };
    if (responseFormat) payload.response_format = responseFormat;

    let message;
    const result = await callLlmStream(provider, apiUrl, apiKey, payload, {
      signal,
      onMessage: (content) => onEvent({ type: "message", content }),
    });
    message = result.message;

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        ...message,
        role: "assistant",
        content: message.content ?? null,
      };
      if (!replayReasoning) {
        delete assistantMsg.reasoning_content;
      }
      workMessages.push(assistantMsg);
      onEvent({ type: "tool_calls", message: assistantMsg });
      const toolMessages = await runTools(message.tool_calls, {
        signal,
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });
      for (const toolMessage of toolMessages) {
        workMessages.push(toolMessage);
      }
      onEvent({ type: "tool_results", messages: toolMessages });
      continue;
    }

    const text = message.content ?? "";
    const replyMsg = {
      ...message,
      role: "assistant",
      content: text,
    };
    if (!replayReasoning) {
      delete replyMsg.reasoning_content;
    }
    workMessages.push(replyMsg);
    if (result.usage) onEvent({ type: "usage", usage: result.usage });
    onEvent({ type: "done", message: replyMsg, text, usage: result.usage || null });
    return { text, messages: workMessages };
  }

  const text = "(达到最大轮次限制)";
  const replyMsg = { role: "assistant", content: text };
  workMessages.push(replyMsg);
  onEvent({ type: "done", message: replyMsg, text });
  return { text, messages: workMessages };
};

export { chat };
