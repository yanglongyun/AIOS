import { db } from './client.js';

export const findPosts = (limit) => {
  return db.prepare(`
    SELECT id, content, created_at
    FROM weibo_posts
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
};
