import { db } from './client.js';

export const findAllVersions = () => {
  return db.prepare(`
    SELECT id, name, prompt, created_at
    FROM playground_versions
    ORDER BY id DESC
  `).all();
};
