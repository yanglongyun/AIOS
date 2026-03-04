import { db } from '../db.js';

export const detailHandler = ({ id } = {}) => {
  const parsedId = Number(id);
  if (!parsedId) return { success: false, message: '缺少 id', status: 400 };

  const row = db.prepare(`
    SELECT id, name, prompt, html, created_at
    FROM playground_versions
    WHERE id = ?
  `).get(parsedId);

  if (!row) return { success: false, message: '版本不存在', status: 404 };

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
