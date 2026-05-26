import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLlmRegular } from "../llm/regular.js";
import { callLlmStream } from "../llm/stream/index.js";
import { normalizeAgentMessages, normalizeChatOptions } from "./utils.js";

const shouldReplayReasoning = (provider, apiUrl, model) => {
  const providerId = String(provider || "").trim();
  const url = String(apiUrl || "").trim();
  const modelId = String(model || "").trim();
  return providerId === "deepseek" || url.includes("api.deepseek.com") || modelId.startsWith("deepseek-");
};

const chat = async (messages, {
  provider = null,
  apiUrl,
  apiKey,
  model,
  send = (_message) => {
  },
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12e3,
  responseFormat = null
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages);
  const replayReasoning = shouldReplayReasoning(provider, apiUrl, model);
  let round = 0;
  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = { model, messages: workMessages, tools };
    if (responseFormat) payload.response_format = responseFormat;
    const message = responseFormat
      ? await callLlmRegular(provider, apiUrl, apiKey, payload, signal)
      : await callLlmStream(provider, apiUrl, apiKey, payload, {
        signal,
        onDelta: (delta) => {
          if (delta) send({ type: "delta", delta });
        }
      });
    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls
      };
      if (message.reasoning_content !== undefined) {
        assistantMsg.reasoning_content = message.reasoning_content ?? "";
      } else if (String(apiUrl || "").includes("moonshot.cn") || String(apiUrl || "").includes("kimi.com")) {
        assistantMsg.reasoning_content = "";
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
    if (replayReasoning && message.reasoning_content !== undefined) {
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
