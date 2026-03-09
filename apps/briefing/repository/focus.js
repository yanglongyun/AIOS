import { db } from './client.js';

export const upsertProfile = (focus) => {
  db.prepare(`
    INSERT INTO apps_briefing_profile (id, focus, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      updated_at = datetime('now')
  `).run(focus);
};

export const getProfile = () => {
  return db.prepare(`
    SELECT focus, updated_at AS updatedAt
    FROM apps_briefing_profile
    WHERE id = 1
    LIMIT 1
  `).get();
};
