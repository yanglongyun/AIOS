import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';

export const createChat = (title = '新对话') => {
  const sessionId = randomUUID();
  db.prepare('INSERT INTO chats (session_id, title) VALUES (?, ?)').run(sessionId, title);
  return { sessionId };
};
