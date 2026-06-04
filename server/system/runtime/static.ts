// @ts-nocheck
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GUI_DIST = path.resolve(__dirname, "../../../gui/dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

const safeResolve = (urlPath) => {
  const clean = decodeURIComponent(String(urlPath || "/").split("?")[0]);
  const target = path.normalize(path.join(GUI_DIST, clean));
  // 防目录穿越:解析结果必须仍在 GUI_DIST 内
  if (target !== GUI_DIST && !target.startsWith(`${GUI_DIST}${path.sep}`)) {
    return null;
  }
  return target;
};

const sendFile = (res, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  res.end(fs.readFileSync(filePath));
};

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

// 服务构建后的 GUI(gui/dist),非资源路径回退到 index.html(SPA)
const serveGui = (req, res, pathname) => {
  const indexHtml = path.join(GUI_DIST, "index.html");

  if (!isFile(indexHtml)) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("GUI 尚未构建。请先运行: npm run gui:build\n");
    return true;
  }

  const target = safeResolve(pathname === "/" ? "/index.html" : pathname);
  if (target && isFile(target)) {
    sendFile(res, target);
    return true;
  }

  // SPA 回退
  sendFile(res, indexHtml);
  return true;
};

export { serveGui };
