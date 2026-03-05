import { db } from '../db.js';

export const deleteHandler = (body = {}) => {
  const id = Number(body.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };
  db.prepare('DELETE FROM weibo_posts WHERE id = ?').run(id);
  return { success: true };
};
