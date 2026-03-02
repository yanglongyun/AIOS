import { db } from '../../app_shared/db/client.js';

export const readHandler = (body = {}) => {
  const id = Number(body.id);
  if (!id) return { success: false, message: '缺少 id', status: 400 };

  const isRead = body.isRead ? 1 : 0;
  db.prepare('UPDATE inbox_messages SET is_read = ? WHERE id = ?').run(isRead, id);
  return { success: true };
};
