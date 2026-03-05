import { db } from '../db.js';
import { taskAgentJson } from '../../app_shared/taskAgent.js';

const taskAgent = async ({ date, question, answer, note, req }) => {
  const parsed = await taskAgentJson({
    app: 'dailycheck',
    prompt: [
      '你在处理 dailycheck 的回答请求。',
      '你可以自行使用 shell 查询上下文信息。',
      '最终只输出 JSON：{"response":"...","note":"..."}，不要输出任何其它文字。',
      `日期：${date}`,
      `问题：${question}`,
      `回答：${answer}`,
      `当前 note：${note || ''}`
    ].join('\n'),
    req
  });
  return {
    response: String(parsed.response || '').trim(),
    note: String(parsed.note || '').trim()
  };
};

export const answerHandler = async (body = {}, req) => {
  const dailyId = Number(body.dailyId);
  const answer = String(body.answer || '').trim();

  if (!Number.isInteger(dailyId) || dailyId <= 0) {
    return { status: 400, message: 'dailyId 无效' };
  }
  if (!answer) {
    return { status: 400, message: 'answer 不能为空' };
  }

  const exists = db.prepare(`
    SELECT id, date, question, note
    FROM apps_dailycheck_daily
    WHERE id = ?
    LIMIT 1
  `).get(dailyId);
  if (!exists) {
    return { status: 404, message: '记录不存在' };
  }

  db.prepare(`
    UPDATE apps_dailycheck_daily
    SET answer = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(answer, dailyId);

  let response = '';
  let note = '';
  try {
    const result = await taskAgent({
      date: exists.date,
      question: exists.question,
      answer,
      note: exists.note,
      req
    });
    response = result.response;
    note = result.note;
  } catch {}

  db.prepare(`
    UPDATE apps_dailycheck_daily
    SET response = ?, note = CASE WHEN ? <> '' THEN ? ELSE note END, updated_at = datetime('now')
    WHERE id = ?
  `).run(response, note, note, dailyId);

  const daily = db.prepare(`
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
  `).get(dailyId);

  return { success: true, today: daily };
};
