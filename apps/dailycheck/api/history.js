import { db } from '../db.js';

export const historyHandler = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(30, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_dailycheck_questions').get().c || 0;
  const rows = db.prepare(`
    SELECT
      q.id, q.date, q.question, q.purpose, q.tags_json, q.created_at,
      a.answer, a.updated_at AS answer_updated_at
    FROM apps_dailycheck_questions q
    LEFT JOIN apps_dailycheck_answers a ON a.question_id = q.id
    ORDER BY q.date DESC
    LIMIT ? OFFSET ?
  `).all(safePageSize, offset);

  return {
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      date: r.date,
      question: r.question,
      purpose: r.purpose || '',
      tags: (() => {
        try { return JSON.parse(r.tags_json || '[]'); } catch { return []; }
      })(),
      answer: r.answer || '',
      answered: Boolean(r.answer),
      updatedAt: r.answer_updated_at || r.created_at
    })),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
