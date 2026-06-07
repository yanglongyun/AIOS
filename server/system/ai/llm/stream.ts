// @ts-nocheck
// 流式调用:按 provider 选解析器,逐 SSE 块解析,content 经 onMessage 回调。
// 返回完整 message(可能含 tool_calls / reasoning_content)与 usage(若服务端在流里给了)。
import { buildLlmHeaders } from "./common.js";
import { deepseekParser } from "./parsers/deepseek.js";
import { geminiParser } from "./parsers/gemini.js";
import { kimiParser } from "./parsers/kimi.js";
import { openaiParser } from "./parsers/openai.js";

const pickParser = (provider, apiUrl) => {
  const p = String(provider || "").toLowerCase();
  const url = String(apiUrl || "");
  if (p === "deepseek" || url.includes("api.deepseek.com")) return deepseekParser;
  if (p === "kimi" || url.includes("moonshot") || url.includes("kimi.com")) return kimiParser;
  if (p === "gemini" || url.includes("/gemini/")) return geminiParser;
  return openaiParser;
};

const callLlmStream = async (provider, apiUrl, apiKey, payload, { signal, onMessage } = {}) => {
  const parser = pickParser(provider, apiUrl);
  const streamPayload = {
    ...payload,
    stream: true,
    stream_options: {
      ...(payload.stream_options || {}),
      include_usage: true,
    },
  };
  const state = parser.createState();
  let usage = null;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: buildLlmHeaders(provider, apiUrl, apiKey),
    body: JSON.stringify(streamPayload),
    signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("LLM stream body is empty");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep = buffer.indexOf("\n\n");
    while (sep >= 0) {
      const event = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      sep = buffer.indexOf("\n\n");
      const lines = event.split("\n").map((line) => line.trim()).filter(Boolean);
      const dataLines = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
      if (!dataLines.length) continue;
      const raw = dataLines.join("\n");
      if (!raw || raw === "[DONE]") continue;
      let json;
      try {
        json = JSON.parse(raw);
      } catch {
        continue;
      }
      if (json && json.usage) usage = json.usage;
      parser.parseChunk(json, state, onMessage);
    }
  }

  return { message: parser.toMessage(state, { provider, apiUrl }), usage };
};

export { callLlmStream };
