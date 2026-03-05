import { db } from '../db.js';

export const listHandler = (query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_fortune_records').get().c;
  const items = db.prepare(`
    SELECT id, question, sign_name AS signName, sign_poem AS signPoem, good, bad, advice, hexagram, created_at AS createdAt
    FROM apps_fortune_records ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  return { success: true, items, total, page, pageSize };
};
