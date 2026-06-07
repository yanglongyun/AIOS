// @ts-nocheck
// DeepSeek:在 OpenAI 基础上额外累积 reasoning_content。
import { openaiParser } from "./openai.js";

const deepseekParser = {
  createState() {
    return { ...openaiParser.createState(), reasoningContent: "" };
  },
  parseChunk(json, state, onMessage) {
    openaiParser.parseChunk(json, state, onMessage);
    const delta = json?.choices?.[0]?.delta || {};
    const reasoningText =
      typeof delta.reasoning_content === "string"
        ? delta.reasoning_content
        : typeof delta.reasoning === "string"
          ? delta.reasoning
          : "";
    if (reasoningText) state.reasoningContent += reasoningText;
  },
  toMessage(state) {
    const message = openaiParser.toMessage(state);
    if (message.tool_calls || state.reasoningContent) {
      message.reasoning_content = state.reasoningContent || "";
    }
    return message;
  },
};

export { deepseekParser };
