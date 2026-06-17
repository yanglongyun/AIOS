// @ts-nocheck
import { randomUUID } from "node:crypto";
import { getDb } from "../../db.js";

const createChat = (title = "New chat", app = "chat", meta = null, chatId = null) => {
  const id = String(chatId || "").trim() || randomUUID();
  const trimmed = String(title || "New chat").trim() || "New chat";
  const chatApp = String(app || "chat").trim() || "chat";
  getDb()
    .prepare("INSERT INTO chats (id, title, app, meta) VALUES (?, ?, ?, ?)")
    .run(id, trimmed, chatApp, meta ? JSON.stringify(meta) : null);
  return { id, title: trimmed, description: "", app: chatApp, meta, state: "idle", pinned: 0 };
};

export { createChat };
