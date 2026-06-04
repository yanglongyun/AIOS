// @ts-nocheck
// Gemini(OpenAI 兼容端点):直接复用 OpenAI 解析。
import { openaiParser } from "./openai.js";

const geminiParser = {
  createState() {
    return openaiParser.createState();
  },
  parseChunk(json, state, onDelta) {
    openaiParser.parseChunk(json, state, onDelta);
  },
  toMessage(state) {
    return openaiParser.toMessage(state);
  },
};

export { geminiParser };
