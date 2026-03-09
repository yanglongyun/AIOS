import { deleteById } from '../repository/delete.js';

export const removeMessage = (body = {}) => {
  const id = Number(body.id);
  if (!id) return { success: false, message: '缺少 id', status: 400 };

  deleteById(id);
  return { success: true };
};
