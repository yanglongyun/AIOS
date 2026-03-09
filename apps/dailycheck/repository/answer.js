import { db } from './client.js';

export const getDailyById = (id) => {
  return db.prepare(`
    SELECT id, date, question, note
    FROM apps_dailycheck_daily
    WHERE id = ?
    LIMIT 1
  `).get(id);
};

export const updateAnswer = (answer, id) => {
  db.prepare(`
    UPDATE apps_dailycheck_daily
    SET answer = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(answer, id);
};

export const updateResponseAndNote = (response, note, id) => {
  db.prepare(`
    UPDATE apps_dailycheck_daily
    SET response = ?, note = CASE WHEN ? <> '' THEN ? ELSE note END, updated_at = datetime('now')
    WHERE id = ?
  `).run(response, note, note, id);
};

export const getDailyFullById = (id) => {
  return db.prepare(`
    SELECT
      id,
      date,
      question,
      answer,
      response,
      created_at AS createdAt,
      updated_at AS updatedAt,
      CASE WHEN trim(answer) <> '' THEN 1 ELSE 0 END AS answered,
      COALESCE(updated_at, created_at) AS answerUpdatedAt
    FROM apps_dailycheck_daily
    WHERE id = ?
    LIMIT 1
  `).get(id);
};
