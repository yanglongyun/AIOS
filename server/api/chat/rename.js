import { db } from '../../db/client.js';

export const renameChat = (chatId, title) => {
  db.prepare('UPDATE chats SET title = ? WHERE id = ?').run(title, chatId);
  return { ok: true };
};
