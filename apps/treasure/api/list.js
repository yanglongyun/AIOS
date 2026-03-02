import { db } from '../db.js';

export const listHandler = (query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(query.pageSize || 50)));
  const offset = (page - 1) * pageSize;

  const list = db.prepare(`
    SELECT id, name, category, condition_text, summary_tag, value, comment, created_at
    FROM apps_treasures
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_treasures').get().c;
  const totalWealth = db.prepare('SELECT COALESCE(SUM(value), 0) AS s FROM apps_treasures').get().s;
  return { success: true, list, total, totalWealth, page, pageSize };
};
