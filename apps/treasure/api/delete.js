import { db } from '../../app_shared/db/client.js';

export const deleteHandler = (body = {}) => {
  const id = Number(body.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  const info = db.prepare('DELETE FROM apps_treasures WHERE id = ?').run(id);
  if (!info.changes) return { status: 404, message: '藏品不存在' };
  return { success: true };
};
