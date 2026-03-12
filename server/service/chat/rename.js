import { renameChatByConversationId } from '../../repository/chat/rename.js';

export const renameChat = (conversationId, title) => {
  renameChatByConversationId(conversationId, title);
  return { ok: true };
};

