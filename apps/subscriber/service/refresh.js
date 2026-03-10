import { agentTaskJson } from '../../app_shared/agentTask.js';
import { toDateKey } from '../../../shared/time/dateKey.js';
import { getProfileFocus, upsertProfile, getDailyByDate, upsertDaily, getDailyFullByDate } from '../repository/refresh.js';

const taskAgent = async ({ date, focus, note, req }) => {
  const parsed = await agentTaskJson({
    app: 'subscriber',
    title: `订阅收报 ${date}`,
    prompt: [
      '你在处理 subscriber（订阅机）的今日新闻简报生成请求。',
      '你可以自行使用 shell 搜索和阅读网页，再整理结果。',
      '最终只输出 JSON，不要输出任何其它文字。',
      'JSON 格式必须是：{"title":"...","brief":"...","content":"...","note":"..."}。',
      '其中 content 建议使用多段文本，包含要点列表。',
      `日期：${date}`,
      `用户关注方向：${focus}`,
      `当前 note：${note || ''}`
    ].join('\n'),
    req
  });

  return {
    title: String(parsed.title || '').trim(),
    brief: String(parsed.brief || '').trim(),
    content: String(parsed.content || '').trim(),
    note: String(parsed.note || '').trim()
  };
};

export const refresh = async (body = {}, req) => {
  const profile = getProfileFocus();
  const focus = String(body.focus || profile?.focus || '').trim();
  if (!focus) {
    return { status: 400, message: 'focus 不能为空' };
  }

  upsertProfile(focus);

  const date = toDateKey();
  const prev = getDailyByDate(date);

  const result = await taskAgent({ date, focus, note: prev?.note || '', req });
  if (!result.title || !result.brief || !result.content) {
    return { status: 500, message: '生成结果不完整' };
  }

  upsertDaily(date, focus, result.title, result.brief, result.content, result.note);

  const today = getDailyFullByDate(date);
  return { success: true, today };
};
