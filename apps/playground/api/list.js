import { db } from '../../db/client.js';

export const listHandler = () => {
  const data = db.prepare(`
    SELECT id, name, prompt, created_at
    FROM playground_versions
    ORDER BY id DESC
  `).all();
  return { success: true, data };
};
