import { db } from '../db.js';

export const listHandler = ({ q = '', page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;
  const keyword = String(q || '').trim();
  const like = `%${keyword}%`;
  const where = keyword ? 'WHERE content LIKE ?' : '';

  const totalQuery = `SELECT COUNT(*) AS c FROM apps_notes ${where}`;
  const listQuery = `
    SELECT * FROM apps_notes
    ${where}
    ORDER BY pinned DESC, updated_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const total = keyword
    ? db.prepare(totalQuery).get(like).c
    : db.prepare(totalQuery).get().c;
  const items = keyword
    ? db.prepare(listQuery).all(like, safePageSize, offset)
    : db.prepare(listQuery).all(safePageSize, offset);

  return {
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
