// @ts-nocheck
import { getDb } from "../../db.js";

const getChat = (chatId) =>
  getDb()
    .prepare(
      "SELECT id, title, description, app, meta, state, pinned, created_at FROM chats WHERE id = ?",
    )
    .get(String(chatId || "").trim()) || null;

export { getChat };
