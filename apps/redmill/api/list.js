import { db } from '../db.js';

export const listHandler = () => {
  const items = db.prepare(`
    SELECT p.id, p.topic, p.created_at AS createdAt,
      (SELECT COUNT(*) FROM apps_redmill_pages WHERE project_id = p.id) AS pageCount
    FROM apps_redmill_projects p ORDER BY p.id DESC LIMIT 50
  `).all();
  return { success: true, items };
};
