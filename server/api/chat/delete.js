import { db } from '../../db/client.js';

export const deleteChat = (chatId) => {
  db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId);
  db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);
  return { ok: true };
};
