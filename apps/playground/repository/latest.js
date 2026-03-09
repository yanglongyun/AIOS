import { db } from './client.js';

export const findLatestVersion = () => {
  return db.prepare(`
    SELECT id, name, prompt, html, created_at
    FROM playground_versions
    ORDER BY id DESC
    LIMIT 1
  `).get();
};
