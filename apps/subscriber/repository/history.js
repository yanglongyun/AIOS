import { db } from "./client.js";
const countDailies = () => {
  return db.prepare("SELECT COUNT(*) AS c FROM subscriber_daily").get().c || 0;
};
const listDailies = (limit, offset) => {
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
export {
  countDailies,
  listDailies
};
