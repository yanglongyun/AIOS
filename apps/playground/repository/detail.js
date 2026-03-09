import { db } from './client.js';

export const findVersionById = (id) => {
  return db.prepare(`
    SELECT id, name, prompt, html, created_at
    FROM playground_versions
    WHERE id = ?
  `).get(id);
};
