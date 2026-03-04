import { db } from '../db.js';

export const deleteHandler = (body = {}) => {
  const id = Number(body.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  db.prepare('DELETE FROM apps_redmill_pages WHERE project_id = ?').run(id);
  const info = db.prepare('DELETE FROM apps_redmill_projects WHERE id = ?').run(id);
  if (!info.changes) return { status: 404, message: '项目不存在' };

  return { success: true };
};
