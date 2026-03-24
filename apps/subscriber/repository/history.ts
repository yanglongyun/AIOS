import { db } from './client.ts';

export const countDailies = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM subscriber_daily').get().c || 0;
};

export const listDailies = (limit, offset) => {
  return db.prepare(`
    SELECT
      id,
      date,
      focus,
      title,
      brief,
      content,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM subscriber_daily
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
};
