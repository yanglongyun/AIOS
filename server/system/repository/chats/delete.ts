// @ts-nocheck
import { getDb } from "../db.js";

const deleteChat = (conversationId) => {
  const db = getDb();
  const id = String(conversationId);
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM chats WHERE conversation_id = ?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { deleteChat };
