import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callChatCompletion } from "./client.js";
import { normalizeAgentMessages, normalizeChatOptions } from "./utils.js";

const chat = async (messages, {
  apiUrl,
  apiKey,
  model,
  send = (_message) => {
  },
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12e3
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages);
  let round = 0;
  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = { model, messages: workMessages, tools };
    const { message } = await callChatCompletion(apiUrl, apiKey, payload, { signal });
    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      if (message.reasoning_content !== undefined) {
        assistantMsg.reasoning_content = message.reasoning_content ?? "";
      }
      workMessages.push(assistantMsg);
      send({ type: "assistant_tool_calls", message: assistantMsg });
      for (const toolCall of message.tool_calls) {
        send({ type: "tool_call", toolCall });
      }
      const toolMessages = await runTools(message.tool_calls, {
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });
      for (const tm of toolMessages) {
        workMessages.push(tm);
        send({ type: "tool_result", message: tm });
      }
      continue;
    }
    const replyMsg = {
      role: "assistant",
      content: message.content ?? ""
    };
    if (message.reasoning_content !== undefined) {
      replyMsg.reasoning_content = message.reasoning_content ?? "";
    }
    workMessages.push(replyMsg);
    send({ type: "done", message: replyMsg });
    return replyMsg;
  }
  const limitMessage = { role: "assistant", content: "(达到最大轮次限制)" };
  send({ type: "done", message: limitMessage });
  return limitMessage;
};
export {
  chat
};
