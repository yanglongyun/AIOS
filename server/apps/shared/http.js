// @ts-nocheck
// app 后端共用的 HTTP 小工具:读 body、回 JSON、解析 JSON。
const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload)}\n`);
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const parseJson = (raw, label = "json") => {
  const input = String(raw ?? "").trim();
  if (!input) throw badRequest(`Invalid JSON in ${label}: empty input`);
  try {
    return JSON.parse(input);
  } catch (error) {
    throw badRequest(`Invalid JSON in ${label}: ${error.message}`);
  }
};

export { readBody, sendJson, parseJson, badRequest };
