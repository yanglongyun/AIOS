import { db } from '../../app_shared/db/client.js';

export const answerHandler = (body = {}) => {
  const questionId = Number(body.questionId);
  const answer = String(body.answer || '').trim();

  if (!Number.isInteger(questionId) || questionId <= 0) {
    return { status: 400, message: 'questionId 无效' };
  }
  if (!answer) {
    return { status: 400, message: '回答不能为空' };
  }

  const q = db.prepare('SELECT id FROM apps_lifeguide_questions WHERE id = ? LIMIT 1').get(questionId);
  if (!q) return { status: 404, message: '问题不存在' };

  db.prepare(`
    INSERT INTO apps_lifeguide_answers (question_id, answer, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(question_id) DO UPDATE SET
      answer = excluded.answer,
      updated_at = datetime('now')
  `).run(questionId, answer);

  return { success: true };
};
