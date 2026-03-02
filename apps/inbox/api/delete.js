import { db } from '../db.js';

export const deleteHandler = (body = {}) => {
  const id = Number(body.id);
  if (!id) return { success: false, message: '缺少 id', status: 400 };

  db.prepare('DELETE FROM inbox_messages WHERE id = ?').run(id);
  return { success: true };
};
