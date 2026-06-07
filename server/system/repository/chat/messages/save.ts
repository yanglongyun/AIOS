// @ts-nocheck
import { getDb } from "../../db.js";
import { requireMessageSource } from "./source.js";

const saveMessageBatch = (chatId, source, messages, usage = null) => {
  const db = getDb();
  const messageSource = requireMessageSource(source);
  const stmt = db.prepare(`
    INSERT INTO messages (chat_id, source, message, usage)
    VALUES (?, ?, ?, ?)
  `);
  const id = String(chatId || "").trim();
  db.exec("BEGIN");
  try {
    for (const message of messages) {
      stmt.run(
        id,
        messageSource,
        JSON.stringify(message),
        usage ? JSON.stringify(usage) : null,
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { saveMessageBatch };
