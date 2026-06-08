// @ts-nocheck
import { randomUUID } from "crypto";
import { getDb } from "../../db.js";

const createChat = (title = "新对话", app = "chat", meta = null, chatId = null) => {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("title is required");
  const id = String(chatId || "").trim() || randomUUID();
  const chatApp = String(app || "").trim() || "chat";
  getDb()
    .prepare("INSERT INTO chats (id, title, app, meta) VALUES (?, ?, ?, ?)")
    .run(id, trimmed, chatApp, meta ? JSON.stringify(meta) : null);
  return { id, title: trimmed, app: chatApp, meta };
};

export { createChat };
