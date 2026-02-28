import { db } from '../../../db/client.js';

export const detailHandler = ({ id } = {}) => {
  const parsedId = Number(id);
  if (!parsedId) return { success: false, message: '缺少 id', status: 400 };

  const row = db.prepare(`
    SELECT id, name, prompt, html, suggestions, created_at
    FROM playground_versions
    WHERE id = ?
  `).get(parsedId);

  if (!row) return { success: false, message: '版本不存在', status: 404 };

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
