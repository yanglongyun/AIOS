import { db } from '../client.ts';

export const renameChatByConversationId = (conversationId, title) => {
  db.prepare('UPDATE chats SET title = ? WHERE conversation_id = ?').run(title, conversationId);
};

