// @ts-nocheck
import { getDb } from "../../db.js";

const appendMessage = (chatId, message, meta = null) => {
  const result = getDb()
    .prepare(`
      INSERT INTO messages (chat_id, message, meta)
      VALUES (?, ?, ?)
    `)
    .run(
      String(chatId || "").trim(),
      JSON.stringify(message),
      meta ? JSON.stringify(meta) : null,
    );
  return Number(result.lastInsertRowid);
};

export { appendMessage };
