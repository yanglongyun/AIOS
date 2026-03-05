import { db } from '../db.js';
import { agentTaskJson } from '../../app_shared/agentTask.js';
import { toDateKey } from '../../../shared/time/dateKey.js';

const taskAgent = async ({ date, focus, note, req }) => {
  const parsed = await agentTaskJson({
    app: 'briefing',
    title: `简报刷新 ${date}`,
    prompt: [
      '你在处理 briefing 的今日新闻简报生成请求。',
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

export const refreshHandler = async (body = {}, req) => {
  const profile = db.prepare(`
    SELECT focus
    FROM apps_briefing_profile
    WHERE id = 1
    LIMIT 1
  `).get();

  const focus = String(body.focus || profile?.focus || '').trim();
  if (!focus) {
    return { status: 400, message: 'focus 不能为空' };
  }

  db.prepare(`
    INSERT INTO apps_briefing_profile (id, focus, updated_at)
    VALUES (1, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      focus = excluded.focus,
      updated_at = datetime('now')
  `).run(focus);

  const date = toDateKey();
  const prev = db.prepare(`
    SELECT note
    FROM apps_briefing_daily
    WHERE date = ?
    LIMIT 1
  `).get(date);

  const result = await taskAgent({ date, focus, note: prev?.note || '', req });
  if (!result.title || !result.brief || !result.content) {
    return { status: 500, message: '生成结果不完整' };
  }

  db.prepare(`
    INSERT INTO apps_briefing_daily (date, focus, title, brief, content, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(date) DO UPDATE SET
      focus = excluded.focus,
      title = excluded.title,
      brief = excluded.brief,
      content = excluded.content,
      note = CASE WHEN excluded.note <> '' THEN excluded.note ELSE apps_briefing_daily.note END,
      updated_at = datetime('now')
  `).run(date, focus, result.title, result.brief, result.content, result.note);

  const today = db.prepare(`
    SELECT
      id,
      date,
      focus,
      title,
      brief,
      content,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM apps_briefing_daily
    WHERE date = ?
    LIMIT 1
  `).get(date);

  return { success: true, today };
};
