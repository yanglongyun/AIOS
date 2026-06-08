// @ts-nocheck
import fs from "fs";
import os from "os";
import path from "path";
import { promises as fsp } from "fs";

const MIME = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".sh": "text/x-shellscript",
  ".py": "text/x-python",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

const guessMime = (name) => MIME[path.extname(name).toLowerCase()] || "application/octet-stream";

const listDir = async (dir, showHidden) => {
  const target = dir || os.homedir();
  const entries = await fsp.readdir(target, { withFileTypes: true });
  const items = await Promise.all(entries
    .filter((entry) => showHidden || !entry.name.startsWith("."))
    .map(async (entry) => {
      const full = path.join(target, entry.name);
      try {
        const stat = await fsp.stat(full);
        return {
          name: entry.name,
          type: stat.isDirectory() ? "dir" : (entry.isSymbolicLink() ? "link" : "file"),
          size: stat.size,
          mtime: stat.mtimeMs,
        };
      } catch {
        return { name: entry.name, type: "unknown", size: 0, mtime: 0 };
      }
    }));
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return { path: target, entries: items };
};

const statPath = async (target) => {
  const stat = await fsp.stat(target);
  return { path: target, type: stat.isDirectory() ? "dir" : "file", size: stat.size, mtime: stat.mtimeMs };
};

const parseMultipartUpload = async (req, targetDir) => {
  const ctype = req.headers["content-type"] || "";
  const match = ctype.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error("Missing multipart boundary");

  const boundary = Buffer.from(`--${(match[1] || match[2]).trim()}`);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const buf = Buffer.concat(chunks);
  const files = [];

  let pos = 0;
  while (pos < buf.length) {
    const start = buf.indexOf(boundary, pos);
    if (start < 0) break;
    pos = start + boundary.length;
    if (buf[pos] === 0x2d && buf[pos + 1] === 0x2d) break;
    pos += 2;

    const headerEnd = buf.indexOf(Buffer.from("\r\n\r\n"), pos);
    if (headerEnd < 0) break;
    const headers = buf.slice(pos, headerEnd).toString("utf8");
    pos = headerEnd + 4;

    const nextBoundary = buf.indexOf(boundary, pos);
    if (nextBoundary < 0) break;
    const body = buf.slice(pos, nextBoundary - 2);
    const filename = headers.match(/filename="([^"]*)"/i)?.[1] || "";
    if (filename) {
      const safeName = path.basename(filename);
      const dest = path.join(targetDir, safeName);
      await fsp.writeFile(dest, body);
      files.push({ name: safeName, path: dest, type: guessMime(safeName), size: body.length });
    }
    pos = nextBoundary;
  }

  return files;
};

const handleFsApi = async (req, res, { sendJson }, pathname, method, url) => {
  if (pathname === "/api/fs/home" && method === "GET") {
    sendJson(res, 200, { ok: true, path: os.homedir(), sep: path.sep, platform: os.platform() });
    return;
  }

  if (pathname === "/api/fs/list" && method === "GET") {
    const target = String(url.searchParams.get("path") || "");
    const showHidden = url.searchParams.get("showHidden") === "true" || url.searchParams.get("showHidden") === "1";
    sendJson(res, 200, { ok: true, ...(await listDir(target, showHidden)) });
    return;
  }

  if (pathname === "/api/fs/stat" && method === "GET") {
    const target = String(url.searchParams.get("path") || "");
    if (!target) return sendJson(res, 400, { ok: false, error: "Missing path" });
    sendJson(res, 200, { ok: true, ...(await statPath(target)) });
    return;
  }

  if (pathname === "/api/fs/read" && method === "GET") {
    const target = String(url.searchParams.get("path") || "");
    if (!target) return sendJson(res, 400, { ok: false, error: "Missing path" });
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) return sendJson(res, 400, { ok: false, error: "Path is a directory" });
    res.writeHead(200, {
      "Content-Type": guessMime(path.basename(target)),
      "Content-Length": stat.size,
    });
    fs.createReadStream(target).pipe(res);
    return;
  }

  if (pathname === "/api/fs" && method === "DELETE") {
    const target = String(url.searchParams.get("path") || "");
    const recursive = url.searchParams.get("recursive") === "true" || url.searchParams.get("recursive") === "1";
    if (!target) return sendJson(res, 400, { ok: false, error: "Missing path" });
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      if (!recursive) return sendJson(res, 400, { ok: false, error: "Directory requires recursive=true" });
      await fsp.rm(target, { recursive: true, force: true });
    } else {
      await fsp.unlink(target);
    }
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/fs/mkdir" && method === "POST") {
    const body = JSON.parse(await new Promise(async (resolve) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      resolve(Buffer.concat(chunks).toString("utf8") || "{}");
    }));
    const target = String(body.path || "");
    if (!target) return sendJson(res, 400, { ok: false, error: "Missing path" });
    await fsp.mkdir(target, { recursive: true });
    sendJson(res, 200, { ok: true, path: target });
    return;
  }

  if (pathname === "/api/fs/rename" && method === "POST") {
    const body = JSON.parse(await new Promise(async (resolve) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      resolve(Buffer.concat(chunks).toString("utf8") || "{}");
    }));
    const from = String(body.from || "");
    const to = String(body.to || "");
    if (!from || !to) return sendJson(res, 400, { ok: false, error: "Missing from/to" });
    await fsp.rename(from, to);
    sendJson(res, 200, { ok: true, from, to });
    return;
  }

  if (pathname === "/api/fs/upload" && method === "POST") {
    const rawDir = String(url.searchParams.get("dir") || path.join(process.cwd(), "files/uploads"));
    const targetDir = path.resolve(process.cwd(), rawDir);
    await fsp.mkdir(targetDir, { recursive: true });
    const files = await parseMultipartUpload(req, targetDir);
    sendJson(res, 200, { ok: true, files });
    return;
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
};

export { handleFsApi };
