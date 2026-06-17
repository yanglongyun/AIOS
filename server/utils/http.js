// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const readJsonBody = async (req) => {
  const text = (await readBody(req)).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text);
};

const contentType = (file) => {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
};

const sendStatic = async (req, res, root) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  const rawPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const target = path.normalize(path.join(root, rawPath));
  if (!target.startsWith(root)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }
  try {
    const bytes = await fs.readFile(target);
    res.writeHead(200, { "Content-Type": contentType(target) });
    res.end(bytes);
  } catch {
    const fallback = path.join(root, "index.html");
    const bytes = await fs.readFile(fallback);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(bytes);
  }
};

export { readBody, readJsonBody, sendJson, sendStatic };
