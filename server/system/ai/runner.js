// @ts-nocheck
import * as functions from "./functions.js";

const truncateToolResult = (content, { enabled = true, maxChars = 12000 } = {}) => {
  const limit = Math.max(1000, Math.min(50000, Number(maxChars) || 12000));
  const text = String(content ?? "");
  if (!enabled || text.length <= limit) return text;
  const head = Math.floor(limit * 0.7);
  const tail = limit - head;
  return `${text.slice(0, head)}
...[truncated ${text.length - limit} chars]...
${text.slice(-tail)}`;
};

const createAbortError = () => {
  if (typeof DOMException === "function") {
    return new DOMException("Aborted", "AbortError");
  }
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
};

const runTools = async (toolCalls, { signal, enableToolResultTruncate = true, toolResultMaxChars = 12000 } = {}) => {
  const results = await Promise.all(toolCalls.map(async (tc) => {
    if (signal?.aborted) {
      throw createAbortError();
    }
    const name = tc.function.name;
    const args = JSON.parse(tc.function.arguments || "{}");
    let content;
    try {
      const fn = functions[name];
      if (!fn) throw new Error(`未知工具: ${name}`);
      content = await fn(args, { signal });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      content = `tool error: ${error.message}`;
    }
    const text = typeof content === "string" ? content : JSON.stringify(content);
    return {
      role: "tool",
      tool_call_id: tc.id,
      content: truncateToolResult(text, { enabled: enableToolResultTruncate, maxChars: toolResultMaxChars }),
    };
  }));

  return results;
};

export { runTools };
