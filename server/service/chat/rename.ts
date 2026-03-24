import { renameChatByConversationId } from '../../repository/chat/rename.ts';

export const renameChat = (conversationId, title) => {
  renameChatByConversationId(conversationId, title);
  return { ok: true };
};

