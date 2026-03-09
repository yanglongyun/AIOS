import { agentTaskJson } from '../../app_shared/agentTask.js';
import { getDailyById, updateAnswer, updateResponseAndNote, getDailyFullById } from '../repository/answer.js';

const taskAgent = async ({ date, question, answer, note, req }) => {
  const parsed = await agentTaskJson({
    app: 'dailycheck',
    title: `每日打卡-回答分析 ${date}`,
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

export const submitAnswer = async (body = {}, req) => {
  const dailyId = Number(body.dailyId);
  const answer = String(body.answer || '').trim();

  if (!Number.isInteger(dailyId) || dailyId <= 0) {
    return { status: 400, message: 'dailyId 无效' };
  }
  if (!answer) {
    return { status: 400, message: 'answer 不能为空' };
  }

  const exists = getDailyById(dailyId);
  if (!exists) {
    return { status: 404, message: '记录不存在' };
  }

  updateAnswer(answer, dailyId);

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

  updateResponseAndNote(response, note, dailyId);

  const daily = getDailyFullById(dailyId);
  return { success: true, today: daily };
};
