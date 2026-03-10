import { db } from './client.js';

export const countDailies = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM apps_subscriber_daily').get().c || 0;
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
    FROM apps_subscriber_daily
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
};
