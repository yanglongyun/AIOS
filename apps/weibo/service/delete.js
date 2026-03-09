import { deletePostById } from '../repository/delete.js';

export const del = (body = {}) => {
  const id = Number(body.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  deletePostById(id);
  return { success: true };
};
