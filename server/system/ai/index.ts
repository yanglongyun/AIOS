// @ts-nocheck
import { tools } from "./tools.js";
import { runTools } from "./runner.js";
import { callLm } from "./lm.js";
import { callLlmStream } from "./llm/stream.js";
import {
  extractSummary,
  normalizeAgentMessages,
  normalizeChatOptions,
  shouldReplayReasoning,
} from "./utils.js";

const chat = async (messages, {
  apiUrl,
  apiKey,
  model,
  provider = "",
  stream = true,
  onEvent = () => {},
  signal,
  maxRounds = 50,
  enableToolResultTruncate = true,
  toolResultMaxChars = 12000
} = {}) => {
  const opts = normalizeChatOptions({ maxRounds, enableToolResultTruncate, toolResultMaxChars });
  const workMessages = normalizeAgentMessages(messages, { model, apiUrl });
  const replayReasoning = shouldReplayReasoning(model, apiUrl);
  let round = 0;

  while (round++ < opts.maxRounds) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const payload = { model, messages: workMessages, tools };

    let message;
    let usage;
    if (stream !== false) {
      const result = await callLlmStream(provider, apiUrl, apiKey, payload, {
        signal,
        onDelta: (delta) => onEvent({ type: "delta", delta }),
      });
      message = result.message;
      usage = result.usage || null;
    } else {
      const lmResult = await callLm(apiUrl, apiKey, payload, { signal });
      message = lmResult?.message || lmResult;
      usage = lmResult?.usage || message?.usage || null;
    }

    if (usage) {
      onEvent({ type: "usage", usage });
    }

    if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
      const assistantMsg = {
        ...message,
        role: "assistant",
        content: message.content ?? null,
        ...(usage ? { usage } : {})
      };
      if (!replayReasoning) {
        delete assistantMsg.reasoning_content;
      }
      workMessages.push(assistantMsg);
      onEvent({ type: "assistant_tool_calls", message: assistantMsg, usage });
      const toolMessages = await runTools(message.tool_calls, {
        signal,
        enableToolResultTruncate: opts.enableToolResultTruncate,
        toolResultMaxChars: opts.toolResultMaxChars
      });
      for (const toolMessage of toolMessages) {
        workMessages.push(toolMessage);
        onEvent({ type: "tool_result", message: toolMessage });
      }
      continue;
    }

    const text = message.content ?? "";
    const summary = extractSummary(text);
    const replyMsg = {
      ...message,
      role: "assistant",
      content: text,
      ...(summary ? { summary } : {}),
      ...(usage ? { usage } : {})
    };
    if (!replayReasoning) {
      delete replyMsg.reasoning_content;
    }
    workMessages.push(replyMsg);
    onEvent({ type: "done", message: replyMsg, text, usage });
    return { text, messages: workMessages };
  }

  const text = "(达到最大轮次限制)";
  const replyMsg = { role: "assistant", content: text };
  workMessages.push(replyMsg);
  onEvent({ type: "done", message: replyMsg, text });
  return { text, messages: workMessages };
};

export { chat };
