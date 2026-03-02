import { db } from '../db.js';

export const todayHandler = () => {
  const profile = db.prepare(`
    SELECT focus, updated_at AS updatedAt
    FROM apps_briefing_profile
    WHERE id = 1
    LIMIT 1
  `).get();

  const today = db.prepare(`
    SELECT
      id,
      date,
      focus,
      title,
      brief,
      content,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM apps_briefing_daily
    ORDER BY date DESC
    LIMIT 1
  `).get();

  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      updatedAt: profile?.updatedAt || null
    },
    today: today || null
  };
};

