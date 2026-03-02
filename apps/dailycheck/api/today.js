import { db } from '../../app_shared/db/client.js';
import { ensureTodayQuestion, formatQuestion } from './generate-question.js';

const calcStreak = () => {
  const rows = db.prepare(`
    SELECT q.date AS date, a.id AS answer_id
    FROM apps_lifeguide_questions q
    LEFT JOIN apps_lifeguide_answers a ON a.question_id = q.id
    ORDER BY q.date DESC
  `).all();

  let streak = 0;
  for (const r of rows) {
    if (!r.answer_id) break;
    streak += 1;
  }
  return streak;
};

export const todayHandler = async () => {
  const questionRow = await ensureTodayQuestion();
  const answerRow = db.prepare(`
    SELECT id, answer, created_at, updated_at
    FROM apps_lifeguide_answers
    WHERE question_id = ?
    LIMIT 1
  `).get(questionRow.id);

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM apps_lifeguide_questions) AS total_questions,
      (SELECT COUNT(*) FROM apps_lifeguide_answers) AS total_answers
  `).get();

  return {
    success: true,
    today: {
      ...formatQuestion(questionRow),
      answered: Boolean(answerRow),
      answer: answerRow?.answer || '',
      answerUpdatedAt: answerRow?.updated_at || answerRow?.created_at || null
    },
    stats: {
      totalQuestions: stats.total_questions || 0,
      totalAnswers: stats.total_answers || 0,
      streak: calcStreak()
    }
  };
};
