import { deleteChatByConversationId } from '../../repository/chat/delete.js';

export const deleteChat = (conversationId) => {
  deleteChatByConversationId(conversationId);
  return { ok: true };
};

