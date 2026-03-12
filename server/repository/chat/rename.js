import { db } from '../client.js';

export const renameChatByConversationId = (conversationId, title) => {
  db.prepare('UPDATE chats SET title = ? WHERE conversation_id = ?').run(title, conversationId);
};

