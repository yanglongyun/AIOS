import { db } from '../../db/client.js';

export const listChats = () => {
  return db.prepare(`
    SELECT id, conversation_id, title, description, created_at
    FROM chats
    ORDER BY created_at DESC
  `).all();
};
