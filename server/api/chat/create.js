import { randomUUID } from 'crypto';
import { db } from '../../db/client.js';

export const createChat = (title = '新对话') => {
  const id = randomUUID();
  db.prepare('INSERT INTO chats (id, title) VALUES (?, ?)').run(id, title);
  return { id };
};
