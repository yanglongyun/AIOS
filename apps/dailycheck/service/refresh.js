import { agentTaskJson } from '../../app_shared/agentTask.js';
import { toDateKey } from '../../../shared/time/dateKey.js';
import { upsertDaily, getDailyByDate } from '../repository/refresh.js';

const taskAgent = async (req) => {
  const parsed = await agentTaskJson({
    app: 'dailycheck',
    title: '每日打卡-刷新问题',
    prompt: [
      '你在处理 dailycheck 的换题请求。',
      '你可以自行使用 shell 查询上下文信息。',
      '最终只输出 JSON：{"question":"..."}，不要输出任何其它文字。'
    ].join('\n'),
    req
  });
  const question = String(parsed.question || '').trim();
  if (!question) throw new Error('question 为空');
  return question;
};

export const refreshQuestion = async (req) => {
  const date = toDateKey();
  const question = await taskAgent(req);

  upsertDaily(date, question);
  const daily = getDailyByDate(date);

  return { success: true, today: daily };
};
