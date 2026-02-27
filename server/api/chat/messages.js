import { db } from '../../db/client.js';

export const getChatMessagesPaged = (chatId, limit = 20, offset = 0) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM messages WHERE chat_id = ?').get(chatId).count;
  // Include id so the frontend can reliably de-duplicate messages across pagination
  // and live websocket updates.
  const rows = db.prepare('SELECT id, message, meta FROM messages WHERE chat_id = ? ORDER BY id DESC LIMIT ? OFFSET ?').all(chatId, limit, offset);

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
