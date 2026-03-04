import { db } from '../db.js';

export const latestHandler = () => {
  const row = db.prepare(`
    SELECT id, name, prompt, html, created_at
    FROM playground_versions
    ORDER BY id DESC
    LIMIT 1
  `).get();

  if (!row) return { success: true, data: null };

  return {
    success: true,
    data: {
      id: row.id,
      name: row.name,
      prompt: row.prompt,
      html: row.html,
      created_at: row.created_at
    }
  };
};
