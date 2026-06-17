// @ts-nocheck
import { getDb } from "../../db.js";

const deleteChat = (chatId) => {
  const id = String(chatId || "").trim();
  const db = getDb();
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM messages WHERE chat_id = ?").run(id);
    db.prepare("DELETE FROM compactions WHERE chat_id = ?").run(id);
    db.prepare("DELETE FROM chats WHERE id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { deleteChat };
