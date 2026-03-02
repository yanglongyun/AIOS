import { db } from '../db.js';

const calcStreak = () => {
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

export const todayHandler = async () => {
  const dailyRow = db.prepare(`
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

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM apps_dailycheck_daily) AS total_days,
      (SELECT COUNT(*) FROM apps_dailycheck_daily WHERE trim(answer) <> '') AS total_answers
  `).get();

  return {
    success: true,
    today: dailyRow || null,
    stats: {
      totalDays: stats.total_days || 0,
      totalAnswers: stats.total_answers || 0,
      streak: calcStreak()
    }
  };
};
