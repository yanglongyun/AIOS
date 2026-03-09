import { db } from './client.js';

export const insertPost = (content) => {
  const info = db.prepare(`
    INSERT INTO weibo_posts (content, created_at)
    VALUES (?, datetime('now'))
  `).run(content);

  return db.prepare(`
    SELECT id, content, created_at
    FROM weibo_posts
    WHERE id = ?
  `).get(info.lastInsertRowid);
};
