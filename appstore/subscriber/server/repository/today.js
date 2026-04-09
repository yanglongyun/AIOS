import { db } from "./client.js";
const getProfile = () => {
  return db.prepare(`
    SELECT focus, schedule_time AS scheduleTime, updated_at AS updatedAt
    FROM subscriber_profile
    WHERE id = 1
    LIMIT 1
  `).get();
};
const getLatestDaily = () => {
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
    LIMIT 1
  `).get();
};
export {
  getLatestDaily,
  getProfile
};
