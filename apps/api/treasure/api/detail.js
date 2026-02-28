import { db } from '../../../db/client.js';

export const detailHandler = (query = {}) => {
  const id = Number(query.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  const detail = db.prepare(`
    SELECT id, name, category, condition_text, summary_tag, value, comment, created_at
    FROM apps_treasures
    WHERE id = ?
  `).get(id);

  if (!detail) return { status: 404, message: '藏品不存在' };
  return { success: true, detail };
};
