// @ts-nocheck
import { getDb } from "../../db.js";
import { getChat } from "./get.js";

const updateChatPinned = (chatId, pinned) => {
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");

  getDb()
    .prepare("UPDATE chats SET pinned = ? WHERE id = ?")
    .run(pinned ? 1 : 0, id);

  return getChat(id);
};

export { updateChatPinned };
