import { createConversation } from '../../chat/conversations.js';

export const createChat = (title = '新对话') => {
  return createConversation(title);
};
