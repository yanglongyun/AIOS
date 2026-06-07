// @ts-nocheck
import { getDb } from "../../db.js";
import { requireMessageSource } from "./source.js";

const appendMessage = (chatId, source, message, usage = null) => {
  const messageSource = requireMessageSource(source);
  const result = getDb()
    .prepare(`
      INSERT INTO messages (chat_id, source, message, usage)
      VALUES (?, ?, ?, ?)
    `)
    .run(
      String(chatId || "").trim(),
      messageSource,
      JSON.stringify(message),
      usage ? JSON.stringify(usage) : null,
    );
  return Number(result.lastInsertRowid);
};

export { appendMessage };
