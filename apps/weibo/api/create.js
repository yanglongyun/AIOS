import { db } from '../db.js';

export const createHandler = (body = {}) => {
  const content = String(body.content || '').trim();
  if (!content) return { status: 400, message: '内容不能为空' };
  if (content.length > 280) return { status: 400, message: '内容不能超过 280 字' };

  const info = db.prepare(`
    INSERT INTO weibo_posts (content, created_at)
    VALUES (?, datetime('now'))
  `).run(content);

  const item = db.prepare(`
    SELECT id, content, created_at
    FROM weibo_posts
    WHERE id = ?
  `).get(info.lastInsertRowid);

  return { success: true, item };
};
