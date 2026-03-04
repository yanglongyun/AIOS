import { db } from '../db/client.js';

export const getMessages = (conversationId, messageLimit = 30) => {
  const limit = Math.max(1, Math.min(500, Number(messageLimit) || 30));
  const rows = db.prepare('SELECT message, meta FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?').all(conversationId, limit);
  return rows.reverse().map((r) => ({ ...JSON.parse(r.message), _meta: r.meta ? JSON.parse(r.meta) : null }));
};

export const saveMessage = (conversationId, msg, meta) => {
  db.prepare('INSERT INTO messages (conversation_id, message, meta) VALUES (?, ?, ?)').run(
    conversationId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null
  );
};
