import { db } from '../client.ts';

export const deleteChatByConversationId = (conversationId) => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
  db.prepare('DELETE FROM chats WHERE conversation_id = ?').run(conversationId);
};

