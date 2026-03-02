import { db } from '../db.js';
import { askAgentJson } from '../../app_shared/askAgent.js';

const toDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const askAgent = async () => {
  const parsed = await askAgentJson({
    app: 'dailycheck',
    prompt: [
      '你在处理 dailycheck 的换题请求。',
      '你可以自行使用 shell 查询上下文信息。',
      '最终只输出 JSON：{"question":"..."}，不要输出任何其它文字。'
    ].join('\n')
  });
  const question = String(parsed.question || '').trim();
  if (!question) throw new Error('question 为空');
  return question;
};

export const refreshHandler = async () => {
  const date = toDateKey();
  const question = await askAgent();

  db.prepare(`
    INSERT INTO apps_dailycheck_daily (date, question, answer, response, updated_at)
    VALUES (?, ?, '', '', datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      question = excluded.question,
      answer = '',
      response = '',
      updated_at = datetime('now')
  `).run(date, question);

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
    WHERE date = ?
    LIMIT 1
  `).get(date);

  return { success: true, today: daily };
};
