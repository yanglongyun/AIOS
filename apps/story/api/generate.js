import { db } from '../db.js';
import { agentTaskJson } from '../../app_shared/agentTask.js';

const normalizeChoices = (choices = []) => {
  const out = [];
  for (const c of choices) {
    const text = String(c || '').trim();
    if (text) out.push(text);
    if (out.length >= 3) break;
  }
  while (out.length < 3) out.push(`继续行动 ${out.length + 1}`);
  return out;
};

const taskAgent = async ({ sessionId, action, req }) => {
  return await agentTaskJson({
    app: 'story',
    title: `故事推进 #${sessionId}`,
    prompt: [
      '你在处理 story 的章节推进请求。',
      '数据库路径：database/apps/story.db',
      '用 shell 查询 apps_story_sessions 获取故事标题、世界观设定、当前梗概、当前进度；',
      '查询 apps_story_chapters 获取该 session 最近 6 章的 action 和 content 作为叙事上下文。',
      `session_id: ${sessionId}`,
      `用户行动：${action}`,
      '最终只输出 JSON：{"content":"本章正文(120-260字)","choices":["选项1","选项2","选项3"],"summary":"更新后的累积梗概(80-140字)","progress":"第N章：副标题"}',
      'choices 恰好3条，每条都能推动剧情向不同方向分叉，不要输出其它文字。'
    ].join('\n'),
    req
  });
};

export const generateHandler = async (body = {}, req) => {
  const sessionId = Number(body.sessionId);
  const action = String(body.action || '').trim() || '开始故事';

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { status: 400, message: 'sessionId 无效' };
  }

  const session = db.prepare('SELECT id FROM apps_story_sessions WHERE id = ?').get(sessionId);
  if (!session) return { status: 404, message: '故事不存在' };

  const result = await taskAgent({ sessionId, action, req });

  const content = String(result.content || '').trim();
  const choices = normalizeChoices(result.choices);
  const summary = String(result.summary || '').trim();
  const progress = String(result.progress || '').trim();

  const { c: prevCount } = db.prepare(
    'SELECT COUNT(*) as c FROM apps_story_chapters WHERE session_id = ?'
  ).get(sessionId);
  const idx = (prevCount || 0) + 1;

  db.prepare(`
    INSERT INTO apps_story_chapters (session_id, idx, action, content, choices_json, summary, progress, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(sessionId, idx, action, content, JSON.stringify(choices), summary, progress);

  db.prepare(`
    UPDATE apps_story_sessions
    SET summary = ?, progress = ?, chapter_count = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(summary, progress, idx, sessionId);

  return { success: true, chapter: { idx, action, content, choices, summary, progress } };
};
