import { db } from '../../db/client.js';

export const latestHandler = () => {
  const row = db.prepare(`
    SELECT id, name, prompt, html, suggestions, created_at
    FROM playground_versions
    ORDER BY id DESC
    LIMIT 1
  `).get();

  if (!row) return { success: true, data: null };

  let suggestions = [];
  try {
    const parsed = JSON.parse(row.suggestions || '[]');
    if (Array.isArray(parsed)) suggestions = parsed;
  } catch {}

  return {
    success: true,
    data: {
      id: row.id,
      name: row.name,
      prompt: row.prompt,
      html: row.html,
      suggestions,
      created_at: row.created_at
    }
  };
};
