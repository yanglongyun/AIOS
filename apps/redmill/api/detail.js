import { db } from '../db.js';

export const detailHandler = (query = {}) => {
  const id = Number(query.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  const project = db.prepare('SELECT id, topic, created_at AS createdAt FROM apps_redmill_projects WHERE id = ?').get(id);
  if (!project) return { status: 404, message: '项目不存在' };

  const pages = db.prepare('SELECT id, page_index AS pageIndex, page_type AS pageType, content FROM apps_redmill_pages WHERE project_id = ? ORDER BY page_index').all(id);

  return { success: true, project: { ...project, pages } };
};
