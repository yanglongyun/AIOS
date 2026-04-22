import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { mkdir, writeFile } from "fs/promises";
import { extname, join, resolve } from "path";
import { FILES_DIR } from "./fs.js";
import { hasChat, createChat } from "../chat/chats.js";
import { listChats } from "../service/chat/list.js";
import { getChatMessagesPaged } from "../service/chat/messages.js";
import { renameChat } from "../service/chat/rename.js";
import { deleteChat } from "../service/chat/delete.js";

const CHAT_UPLOAD_DIR = join(FILES_DIR, "uploads", "chat");
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOADABLE_EXT = new Set([
  ".txt", ".md", ".pdf", ".doc", ".docx", ".json", ".csv",
  ".png", ".jpg", ".jpeg", ".webp", ".log", ".pptx", ".xlsx"
]);
const safeName = (name = "file") => {
  const normalized = String(name || "file")
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();
  const trimmed = normalized.replace(/^\.+/, "").slice(0, 120);
  return trimmed || "file";
};

const uploadChatAttachment = async (body = {}) => {
  const fileName = String(body.name || "").trim();
  const base64 = String(body.data || "").trim();
  if (!fileName || !base64) return { status: 400, message: "name and data are required" };
  const ext = extname(fileName).toLowerCase();
  if (!UPLOADABLE_EXT.has(ext)) return { status: 400, message: `file type not allowed: ${ext || "(none)"}` };

  let buffer;
  try {
    buffer = Buffer.from(base64.replace(/^data:.*;base64,/, ""), "base64");
  } catch {
    return { status: 400, message: "invalid base64 data" };
  }
  if (!buffer.length) return { status: 400, message: "empty file data" };
  if (buffer.length > MAX_UPLOAD_BYTES) return { status: 400, message: "file too large (max 10MB)" };

  await mkdir(CHAT_UPLOAD_DIR, { recursive: true });
  const savedName = safeName(fileName);
  const absPath = resolve(join(CHAT_UPLOAD_DIR, savedName));
  await writeFile(absPath, buffer);
  return {
    success: true,
    file: {
      name: savedName,
      path: absPath,
      size: buffer.length
    }
  };
};

const handleChatApi = async (req, res, path, url) => {
  if (path === "/api/chat/attachments/upload" && req.method === "POST") {
    const body = await readBody(req);
    const data = await uploadChatAttachment(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/api/chat/list" && req.method === "GET") {
    const scene = url.searchParams.get("scene") || null;
    return json(res, listChats(scene));
  }
  if (path === "/api/chat/create" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, createChat(body.title || "新对话", body.scene || "chat", body.meta || null));
  }
  if (path === "/api/chat/messages" && req.method === "GET") {
    const conversationId = url.searchParams.get("conversationId");
    if (!conversationId) return json(res, { error: "Missing conversationId" }, 400);
    if (!hasChat(conversationId)) return json(res, { error: "Conversation not found" }, 404);
    const limit = Number(url.searchParams.get("limit") || 20);
    const offset = Number(url.searchParams.get("offset") || 0);
    return json(res, getChatMessagesPaged(conversationId, limit, offset));
  }
  if (path === "/api/chat/rename" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: "Missing conversationId" }, 400);
    if (!body.title) return json(res, { error: "Missing title" }, 400);
    return json(res, renameChat(body.conversationId, body.title));
  }
  if (path === "/api/chat/delete" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: "Missing conversationId" }, 400);
    return json(res, deleteChat(body.conversationId));
  }
  return json(res, { error: "API endpoint not found" }, 404);
};
export {
  handleChatApi
};
