import { db } from '../../db/client.js';

export const listChats = () => {
  return db.prepare('SELECT * FROM chats ORDER BY created_at DESC').all();
};
