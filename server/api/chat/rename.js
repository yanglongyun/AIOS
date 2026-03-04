import { db } from '../../db/client.js';

export const renameChat = (conversationId, title) => {
  db.prepare('UPDATE chats SET title = ? WHERE conversation_id = ?').run(title, conversationId);
  return { ok: true };
};
