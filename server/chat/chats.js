import { db } from '../db/client.js';

export const getRecentChats = () => {
  return db.prepare(`
    SELECT session_id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    sessionId: row.session_id,
    title: String(row.title || '').trim(),
    description: String(row.description || '').trim().slice(0, 100)
  }));
};
