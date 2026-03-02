import { db } from '../../app_shared/db/client.js';

const parseModelJson = (raw = '') => {
  const text = String(raw || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse((fenced ? fenced[1] : text).trim());
};

const normalizeChoices = (choices = []) => {
  const out = [];
  for (const c of choices) {
    const text = String(c || '').trim();
    if (!text) continue;
    out.push(text);
    if (out.length >= 3) break;
  }
  while (out.length < 3) {
    out.push(`继续行动 ${out.length + 1}`);
  }
  return out;
};

const buildPrompt = ({ title, storyPrompt, summary, progress, chapterCount, userAction, recentChapters }) => {
  const chapterText = recentChapters.length
    ? recentChapters.map((c, idx) => `第${idx + 1}段:\n${c}`).join('\n\n')
    : '（暂无章节）';

  return `你是互动小说引擎。请基于用户动作推进剧情。\n\n故事标题：${title}\n故事设定：${storyPrompt || '（无）'}\n当前梗概：${summary || '（无）'}\n当前进度：${progress || '第0章'}\n已生成章节数：${chapterCount}\n用户本次动作：${userAction || '开始故事'}\n最近章节：\n${chapterText}\n\n输出 JSON（不要输出其它文本）：\n{\n  "content": "本章正文，120-260字",\n  "choices": ["选项1","选项2","选项3"],\n  "summary": "更新后的故事梗概，80-140字",\n  "progress": "当前进度描述，如 第3章：潜入城堡"\n}\n要求：\n1) choices 必须恰好 3 条\n2) 三个选项都要能推动剧情分叉\n3) summary 必须是“到当前为止”的累积梗概\n4) progress 必须体现章节推进\n5) 避免重复上一章句式`; 
};

const fallbackOutput = ({ chapterCount }) => ({
  content: '夜色落下，风吹过空街。你意识到真正的线索刚刚显现，故事正朝更深处展开。',
  choices: ['追踪神秘线索', '先回到安全点整理信息', '联系盟友共享发现'],
  summary: '主角在追查过程中发现关键异动，准备在风险与机会并存的局势下做出下一步决策。',
  progress: `第${chapterCount + 1}章：新的线索`
});

export const generateHandler = async (body = {}) => {
  const sessionId = Number(body.sessionId);
  const userAction = String(body.action || '').trim() || '开始故事';

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return { status: 400, message: 'sessionId 无效' };
  }

  const session = db.prepare(`
    SELECT id, title, story_prompt, summary, progress, total_chapters
    FROM apps_story_sessions
    WHERE id = ?
  `).get(sessionId);

  if (!session) return { status: 404, message: '故事不存在' };

  const recentRows = db.prepare(`
    SELECT content
    FROM apps_story_turns
    WHERE session_id = ? AND role = 'assistant' AND type = 'chapter'
    ORDER BY id DESC
    LIMIT 6
  `).all(sessionId).reverse();

  const recentChapters = recentRows.map((r) => String(r.content || '').trim()).filter(Boolean);

  let out = fallbackOutput({ chapterCount: Number(session.total_chapters || 0) });

  try {
    const resp = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildPrompt({
          title: session.title,
          storyPrompt: session.story_prompt,
          summary: session.summary,
          progress: session.progress,
          chapterCount: Number(session.total_chapters || 0),
          userAction,
          recentChapters
        }) }]
      })
    });

    const data = await resp.json();
    if (!resp.ok || data.success === false) throw new Error(data.message || `LLM ${resp.status}`);

    const parsed = parseModelJson(data.message?.content || '{}');
    out = {
      content: String(parsed.content || out.content).trim() || out.content,
      choices: normalizeChoices(parsed.choices || out.choices),
      summary: String(parsed.summary || out.summary).trim() || out.summary,
      progress: String(parsed.progress || out.progress).trim() || out.progress
    };
  } catch {
    out.choices = normalizeChoices(out.choices);
  }

  const nextTurnIndex = Number(session.total_chapters || 0) + 1;

  db.prepare(`
    INSERT INTO apps_story_turns (
      session_id, turn_index, role, type, content, choices_json, summary, progress, created_at
    ) VALUES (?, ?, 'user', 'action', ?, '[]', ?, ?, datetime('now'))
  `).run(sessionId, nextTurnIndex, userAction, session.summary || '', session.progress || '');

  db.prepare(`
    INSERT INTO apps_story_turns (
      session_id, turn_index, role, type, content, choices_json, summary, progress, created_at
    ) VALUES (?, ?, 'assistant', 'chapter', ?, ?, ?, ?, datetime('now'))
  `).run(sessionId, nextTurnIndex, out.content, JSON.stringify(out.choices), out.summary, out.progress);

  db.prepare(`
    UPDATE apps_story_sessions
    SET summary = ?, progress = ?, total_chapters = ?, last_user_input = ?, last_chapter_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(out.summary, out.progress, nextTurnIndex, userAction, sessionId);

  return {
    success: true,
    chapter: {
      turnIndex: nextTurnIndex,
      content: out.content,
      choices: out.choices,
      summary: out.summary,
      progress: out.progress
    }
  };
};
