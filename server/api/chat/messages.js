import { db } from '../../db/client.js';

export const getChatMessagesPaged = (sessionId, limit = 20, offset = 0) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?').get(sessionId).count;
  const rows = db.prepare('SELECT id, message, meta FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(sessionId, limit, offset);

  return {
    messages: rows.reverse().map((r) => ({
      ...JSON.parse(r.message),
      _id: r.id,
      _meta: r.meta ? JSON.parse(r.meta) : null
    })),
    total,
    hasMore: offset + limit < total,
    offset
  };
};
