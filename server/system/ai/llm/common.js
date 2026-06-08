// @ts-nocheck
// 按 provider 构造请求头(claude 用 x-api-key,其余用 Bearer;openrouter 带额外头)。
const buildLlmHeaders = (provider, apiUrl, apiKey) => {
  const headers = { "Content-Type": "application/json" };
  const p = String(provider || "").toLowerCase();
  if (p === "claude" || p === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  if (String(apiUrl || "").includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "http://127.0.0.1:9502";
    headers["X-Title"] = "AIOS";
  }
  return headers;
};

export { buildLlmHeaders };
