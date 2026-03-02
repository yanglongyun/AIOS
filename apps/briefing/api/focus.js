import { db } from '../db.js';

export const focusHandler = (body = {}) => {
  const focus = String(body.focus || '').trim();

  db.prepare(`
    INSERT INTO apps_briefing_profile (id, focus, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      updated_at = datetime('now')
  `).run(focus);

  const profile = db.prepare(`
    SELECT focus, updated_at AS updatedAt
    FROM apps_briefing_profile
    WHERE id = 1
    LIMIT 1
  `).get();

  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      updatedAt: profile?.updatedAt || null
    }
  };
};

