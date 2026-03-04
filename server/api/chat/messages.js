import { db } from '../../db/client.js';

export const getChatMessagesPaged = (conversationId, limit = 20, offset = 0) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(conversationId).count;
  const rows = db.prepare('SELECT id, message, meta FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(conversationId, limit, offset);

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
