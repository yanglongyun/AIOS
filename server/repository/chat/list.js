import { db } from '../client.js';

export const listChatRows = () => {
  return db.prepare(`
    SELECT id, conversation_id, title, description, created_at
    FROM chats
    ORDER BY created_at DESC
  `).all();
};

