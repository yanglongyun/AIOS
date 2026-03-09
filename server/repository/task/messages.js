import { db } from '../../db/client.js';

export const listMessagesByConversationId = (conversationId) => {
  return db.prepare(
    'SELECT id, message, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC'
  ).all(conversationId);
};
