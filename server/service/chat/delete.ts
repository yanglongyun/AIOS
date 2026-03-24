import { deleteChatByConversationId } from '../../repository/chat/delete.ts';

export const deleteChat = (conversationId) => {
  deleteChatByConversationId(conversationId);
  return { ok: true };
};

