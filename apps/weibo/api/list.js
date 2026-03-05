import { db } from '../db.js';

export const listHandler = ({ limit = 50 } = {}) => {
  const n = Math.max(1, Math.min(200, Number(limit) || 50));
  const data = db.prepare(`
    SELECT id, content, created_at
    FROM weibo_posts
    ORDER BY id DESC
    LIMIT ?
  `).all(n);
  return { success: true, data };
};
