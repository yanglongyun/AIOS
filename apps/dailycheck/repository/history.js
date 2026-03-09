import { db } from './client.js';

export const countDailies = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM apps_dailycheck_daily').get().c || 0;
};

export const listDailies = (limit, offset) => {
  return db.prepare(`
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
  `).all(limit, offset);
};
