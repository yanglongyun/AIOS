// @ts-nocheck
import { getDb } from "../db.js";
import { getChat } from "./get.js";

const updateChatTitle = (conversationId, title) => {
  const id = String(conversationId || "").trim();
  const trimmed = String(title || "").trim();
  if (!id) throw new Error("id is required");
  if (!trimmed) throw new Error("title is required");

  getDb()
    .prepare("UPDATE chats SET title = ? WHERE conversation_id = ?")
    .run(trimmed, id);

  return getChat(id);
};

export { updateChatTitle };
