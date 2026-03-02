import { db } from '../db.js';

export const historyHandler = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(30, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_dailycheck_daily').get().c || 0;
  const rows = db.prepare(`
    SELECT
      id,
      date,
      question,
      answer,
      response,
      CASE WHEN trim(answer) <> '' THEN 1 ELSE 0 END AS answered,
      COALESCE(updated_at, created_at) AS updatedAt
    FROM apps_dailycheck_daily
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(safePageSize, offset);

  return {
    success: true,
    items: rows,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
