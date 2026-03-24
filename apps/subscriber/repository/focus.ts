import { db } from './client.ts';

export const upsertProfile = (focus, scheduleTime) => {
  db.prepare(`
    INSERT INTO subscriber_profile (id, focus, schedule_time, updated_at)
    VALUES (1, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      schedule_time = excluded.schedule_time,
      updated_at = datetime('now')
  `).run(focus, scheduleTime || '08:00');
};

export const getProfile = () => {
  return db.prepare(`
    SELECT focus, schedule_time AS scheduleTime, updated_at AS updatedAt
    FROM subscriber_profile
    WHERE id = 1
    LIMIT 1
  `).get();
};
