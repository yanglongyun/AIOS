// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { readBody } from "../utils/http.js";

const UPLOAD_DIR = path.resolve("uploads");

const parseMultipart = (body, contentType) => {
  const match = String(contentType || "").match(/boundary=([^;]+)/);
  if (!match) return [];
  const boundary = Buffer.from(`--${match[1]}`);
  const parts = [];
  let start = body.indexOf(boundary);
  while (start >= 0) {
    start += boundary.length;
    if (body[start] === 45 && body[start + 1] === 45) break;
    if (body[start] === 13 && body[start + 1] === 10) start += 2;
    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), start);
    if (headerEnd < 0) break;
    const headers = body.slice(start, headerEnd).toString("utf8");
    let next = body.indexOf(boundary, headerEnd + 4);
    if (next < 0) break;
    let content = body.slice(headerEnd + 4, next);
    if (content.length >= 2 && content[content.length - 2] === 13 && content[content.length - 1] === 10) {
      content = content.slice(0, -2);
    }
    parts.push({ headers, content });
    start = next;
  }
  return parts;
};

const handleFsApi = async (req, res, { sendJson }, pathname, method) => {
  if (pathname !== "/api/fs/upload" || method !== "POST") {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const body = await readBody(req);
  const parts = parseMultipart(body, req.headers["content-type"]);
  const files = [];
  for (const part of parts) {
    const nameMatch = part.headers.match(/filename="([^"]+)"/);
    if (!nameMatch) continue;
    const original = path.basename(nameMatch[1]);
    const stored = `${Date.now()}-${randomUUID()}-${original}`;
    const filePath = path.join(UPLOAD_DIR, stored);
    await fs.writeFile(filePath, part.content);
    files.push({
      name: original,
      path: filePath,
      size: part.content.length,
      type: "file",
    });
  }
  sendJson(res, 200, { files });
};

export { handleFsApi };
