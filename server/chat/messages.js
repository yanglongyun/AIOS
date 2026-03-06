import { db } from '../db/client.js';
import { normalizeContextRounds } from '../db/settings.js';

export const getMessages = (conversationId, messageLimit = 100) => {
  const limit = normalizeContextRounds(messageLimit);
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
