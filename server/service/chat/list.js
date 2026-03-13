import { listChatRows } from '../../repository/chat/list.js';

export const listChats = (scene = null) => {
  return listChatRows(scene);
};
