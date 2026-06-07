// @ts-nocheck
import { getDb } from "../../db.js";
import { getChat } from "./get.js";

const renameChat = (chatId, title) => {
  const id = String(chatId || "").trim();
  const trimmed = String(title || "").trim();
  if (!id) throw new Error("chatId is required");
  if (!trimmed) throw new Error("title is required");

  getDb()
    .prepare("UPDATE chats SET title = ? WHERE id = ?")
    .run(trimmed, id);

  return getChat(id);
};

export { renameChat };
