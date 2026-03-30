import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const FILES_DIR = join(ROOT, "files");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXT = /* @__PURE__ */ new Set([
  ".txt",
  ".md",
  ".pdf",
  ".doc",
  ".docx",
  ".json",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".log",
  ".pptx",
  ".xlsx"
]);
const safeName = (name = "file") => String(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
const safePath = (sub) => {
  if (!sub) return ROOT;
  const full = sub.startsWith("/") ? resolve(sub) : resolve(ROOT, sub);
  return full;
};
export {
  ALLOWED_EXT,
  FILES_DIR,
  MAX_SIZE,
  ROOT,
  safeName,
  safePath
};
