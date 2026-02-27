import { db } from '../../db/client.js';

export const getChatMessagesPaged = (chatId, limit = 20, offset = 0) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?').get(chatId).count;
  const rows = db.prepare('SELECT message, meta FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(chatId, limit, offset);

  return {
    messages: rows.reverse().map((r) => ({ ...JSON.parse(r.message), _meta: r.meta ? JSON.parse(r.meta) : null })),
    total,
    hasMore: offset + limit < total,
    offset
  };
};
