import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';

export const createChat = (title = '新对话') => {
  const conversationId = randomUUID();
  db.prepare('INSERT INTO chats (conversation_id, title) VALUES (?, ?)').run(conversationId, title);
  return { conversationId };
};
