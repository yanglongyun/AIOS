// @ts-nocheck
import { getDb } from "../../db.js";

const saveMessageBatch = (chatId, messages, meta = null, usage = null) => {
  const db = getDb();
  const stmt = db.prepare("INSERT INTO messages (chat_id, message, meta, usage) VALUES (?, ?, ?, ?)");
  const id = String(chatId || "").trim();
  const metaText = meta ? JSON.stringify(meta) : null;
  const usageText = usage ? JSON.stringify(usage) : null;
  db.exec("BEGIN");
  try {
    for (const message of messages) {
      stmt.run(id, JSON.stringify(message), metaText, usageText);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

export { saveMessageBatch };
