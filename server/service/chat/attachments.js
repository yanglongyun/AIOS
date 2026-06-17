// @ts-nocheck
import fs from "node:fs";
import path from "node:path";

const existsFile = (value) => {
  try {
    return fs.statSync(value).isFile();
  } catch {
    return false;
  }
};

const resolveAttachmentPath = (item = {}) => {
  const raw = String(item.path || "").trim();
  if (!raw) return "";
  if (path.isAbsolute(raw)) return raw;
  const cached = path.resolve(process.cwd(), raw);
  return existsFile(cached) ? cached : raw;
};

const normalizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      return {
        ...item,
        path: resolveAttachmentPath(item),
      };
    })
    .filter(Boolean);
};

export { normalizeAttachments, resolveAttachmentPath };
