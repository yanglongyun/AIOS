// @ts-nocheck
import { getDb } from "../../db.js";

const appendMessage = (chatId, message, meta = null, usage = null) => {
  const result = getDb()
    .prepare("INSERT INTO messages (chat_id, message, meta, usage) VALUES (?, ?, ?, ?)")
    .run(
      String(chatId || "").trim(),
      JSON.stringify(message),
      meta ? JSON.stringify(meta) : null,
      usage ? JSON.stringify(usage) : null,
    );
  return Number(result.lastInsertRowid);
};

export { appendMessage };
