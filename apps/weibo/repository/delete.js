import { db } from './client.js';

export const deletePostById = (id) => {
  db.prepare('DELETE FROM weibo_posts WHERE id = ?').run(id);
};
