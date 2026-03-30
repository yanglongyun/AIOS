import { stat, unlink } from "fs/promises";
import { ROOT, safePath } from "./shared.js";
const remove = async (filePath = "") => {
  const full = safePath(filePath);
  if (!full || full === ROOT) return { status: 400, message: "invalid path" };
  try {
    const s = await stat(full);
    if (s.isDirectory()) return { status: 400, message: "cannot delete directory" };
    await unlink(full);
    return { success: true };
  } catch {
    return { status: 404, message: "file not found" };
  }
};
export {
  remove
};
