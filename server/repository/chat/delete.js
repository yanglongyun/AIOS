import { db } from '../client.js';

export const deleteChatByConversationId = (conversationId) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
  db.prepare('DELETE FROM chats WHERE conversation_id = ?').run(conversationId);
};

