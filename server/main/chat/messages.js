import { db } from "../repository/client.js";
import { normalizeContextRounds } from "../service/settings/get.js";

const getMessages = (conversationId, messageLimit = 100) => {
  const limit = normalizeContextRounds(messageLimit);
  const rows = db.prepare("SELECT id, message, summary, meta FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?").all(conversationId, limit);
  return rows.reverse().map((r) => ({
    ...JSON.parse(r.message),
    _id: r.id,
    _summary: r.summary ? String(r.summary) : "",
    _meta: r.meta ? JSON.parse(r.meta) : null
  }));
};
const saveMessage = (conversationId, msg, meta, summary = null) => {
  const result = db.prepare("INSERT INTO messages (conversation_id, message, summary, meta) VALUES (?, ?, ?, ?)").run(
    conversationId,
    JSON.stringify(msg),
    summary ? String(summary).trim() : null,
    meta ? JSON.stringify(meta) : null
  );
  return { id: Number(result.lastInsertRowid) };
};
export {
  getMessages,
  saveMessage
};
