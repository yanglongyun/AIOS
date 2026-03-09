import { db } from './client.js';

export const upsertDaily = (date, question) => {
  db.prepare(`
    INSERT INTO apps_dailycheck_daily (date, question, answer, response, updated_at)
    VALUES (?, ?, '', '', datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      question = excluded.question,
      answer = '',
      response = '',
      updated_at = datetime('now')
  `).run(date, question);
};

export const getDailyByDate = (date) => {
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
    WHERE date = ?
    LIMIT 1
  `).get(date);
};
