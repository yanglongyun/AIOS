// @ts-nocheck
// Gemini(OpenAI 兼容端点):直接复用 OpenAI 解析。
import { openaiParser } from "./openai.js";

const geminiParser = {
  createState() {
    return openaiParser.createState();
  },
  parseChunk(json, state, onMessage) {
    openaiParser.parseChunk(json, state, onMessage);
  },
  toMessage(state) {
    return openaiParser.toMessage(state);
  },
};

export { geminiParser };
