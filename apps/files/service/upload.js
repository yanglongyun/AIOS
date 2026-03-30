import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import { ALLOWED_EXT, MAX_SIZE, safeName, safePath } from "./shared.js";
const upload = async (body = {}) => {
  const fileName = String(body.name || "").trim();
  const base64 = String(body.data || "").trim();
  const dir = String(body.dir || "").trim();
  if (!fileName || !base64) return { status: 400, message: "name and data are required" };
  if (!dir) return { status: 400, message: "dir is required" };
  const ext = extname(fileName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || "(none)"}` };
  let buffer = null;
  try {
    const normalized = base64.replace(/^data:.*;base64,/, "");
    buffer = Buffer.from(normalized, "base64");
  } catch {
    return { status: 400, message: "invalid base64 data" };
  }
  if (!buffer || buffer.length === 0) return { status: 400, message: "empty file data" };
  if (buffer.length > MAX_SIZE) return { status: 400, message: "file too large (max 10MB)" };
  const targetDir = safePath(dir);
  if (!targetDir) return { status: 400, message: "invalid directory" };
  await mkdir(targetDir, { recursive: true });
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const savedName = `${ts}-${rand}-${safeName(fileName)}`;
  const absPath = join(targetDir, savedName);
  await writeFile(absPath, buffer);
  return { success: true, file: { name: fileName, path: absPath, size: buffer.length } };
};
export {
  upload
};
