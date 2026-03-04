import { db } from '../../db/client.js';

export const deleteChat = (conversationId) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
  db.prepare('DELETE FROM chats WHERE conversation_id = ?').run(conversationId);
  return { ok: true };
};
