import { db } from './client.js';

export const getProfileFocus = () => {
  return db.prepare(`
    SELECT focus
    FROM apps_briefing_profile
    WHERE id = 1
    LIMIT 1
  `).get();
};

export const upsertProfile = (focus) => {
  db.prepare(`
    INSERT INTO apps_briefing_profile (id, focus, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      updated_at = datetime('now')
  `).run(focus);
};

export const getDailyByDate = (date) => {
  return db.prepare(`
    SELECT note
    FROM apps_briefing_daily
    WHERE date = ?
    LIMIT 1
  `).get(date);
};

export const upsertDaily = (date, focus, title, brief, content, note) => {
  db.prepare(`
    INSERT INTO apps_briefing_daily (date, focus, title, brief, content, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      focus = excluded.focus,
      title = excluded.title,
      brief = excluded.brief,
      content = excluded.content,
      note = CASE WHEN excluded.note <> '' THEN excluded.note ELSE apps_briefing_daily.note END,
      updated_at = datetime('now')
  `).run(date, focus, title, brief, content, note);
};

export const getDailyFullByDate = (date) => {
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
    FROM apps_briefing_daily
    WHERE date = ?
    LIMIT 1
  `).get(date);
};
