// @ts-nocheck
import { getDb } from "../../db.js";

const updateChatState = (chatId, state = "idle") => {
  getDb()
    .prepare("UPDATE chats SET state = ? WHERE id = ?")
    .run(String(state || "idle"), String(chatId || "").trim());
};

export { updateChatState };
