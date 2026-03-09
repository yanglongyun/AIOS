import { updateIsRead } from '../repository/read.js';

export const markRead = (body = {}) => {
  const id = Number(body.id);
  if (!id) return { success: false, message: '缺少 id', status: 400 };

  const isRead = body.isRead ? 1 : 0;
  updateIsRead(isRead, id);
  return { success: true };
};
