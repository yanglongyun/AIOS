import { listChatRows } from '../../repository/chat/list.ts';

export const listChats = (scene = null) => {
  return listChatRows(scene);
};
