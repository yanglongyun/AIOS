// @ts-nocheck
import { randomUUID } from "crypto";
import { getDb } from "../../db.js";

const createChat = (title = "新对话", scene = "chat", meta = null) => {
  const trimmed = String(title || "").trim();
  if (!trimmed) throw new Error("title is required");
  const id = randomUUID();
  getDb()
    .prepare("INSERT INTO chats (id, title, scene, meta) VALUES (?, ?, ?, ?)")
    .run(id, trimmed, scene || "chat", meta ? JSON.stringify(meta) : null);
  return { id, title: trimmed, scene: scene || "chat", meta };
};

export { createChat };
