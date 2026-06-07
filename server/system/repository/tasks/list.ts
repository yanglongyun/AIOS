// @ts-nocheck
import { getDb } from "../db.js";

const listTasks = ({ chatId, limit = 50 } = {}) => {
  const db = getDb();
  if (chatId) {
    return db
      .prepare(
        `SELECT * FROM tasks
         WHERE chat_id = ?
         ORDER BY id DESC LIMIT ?`
      )
      .all(chatId, limit);
  }
  return db.prepare("SELECT * FROM tasks ORDER BY id DESC LIMIT ?").all(limit);
};

export { listTasks };
