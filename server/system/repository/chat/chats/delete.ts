// @ts-nocheck
import { getDb } from "../../db.js";

const deleteChat = (chatId) => {
  const db = getDb();
  const id = String(chatId || "").trim();
  if (!id) throw new Error("chatId is required");
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM messages WHERE chat_id = ?").run(id);
    db.prepare("DELETE FROM chats WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { deleteChat };
