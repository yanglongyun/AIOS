import { db } from './client.js';

export const insertIfNotExists = (date, question) => {
  db.prepare(`
    INSERT INTO apps_dailycheck_daily (date, question, answer, response, note, updated_at)
    VALUES (?, ?, '', '', '', datetime('now'))
    ON CONFLICT(date) DO NOTHING
  `).run(date, question);
};

export const getLatestDaily = () => {
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
    ORDER BY date DESC
    LIMIT 1
  `).get();
};

export const getStats = () => {
  return db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM apps_dailycheck_daily) AS total_days,
      (SELECT COUNT(*) FROM apps_dailycheck_daily WHERE trim(answer) <> '') AS total_answers
  `).get();
};

export const calcStreak = () => {
  const rows = db.prepare(`
    SELECT date, answer
    FROM apps_dailycheck_daily
    ORDER BY date DESC
  `).all();

  let streak = 0;
  for (const r of rows) {
    if (!String(r.answer || '').trim()) break;
    streak += 1;
  }
  return streak;
};
