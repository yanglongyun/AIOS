import { db } from './client.js';

export const getProfileFocus = () => {
  return db.prepare(`
    SELECT focus
    FROM subscriber_profile
    WHERE id = 1
    LIMIT 1
  `).get();
};

export const upsertProfile = (focus) => {
  db.prepare(`
    INSERT INTO subscriber_profile (id, focus, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      updated_at = datetime('now')
  `).run(focus);
};

export const getDailyByDate = (date) => {
  return db.prepare(`
    SELECT note
    FROM subscriber_daily
    WHERE date = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(date);
};

export const insertDaily = (date, focus, title, brief, content, note) => {
  db.prepare(`
    INSERT INTO subscriber_daily (date, focus, title, brief, content, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
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
    FROM subscriber_daily
    WHERE date = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(date);
};
