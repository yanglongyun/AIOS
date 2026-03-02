import { db } from '../../app_shared/db/client.js';

export const historyHandler = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: 'sessionId 无效' };

  const session = db.prepare(`
    SELECT id, title, story_prompt, summary, progress, total_chapters, created_at, updated_at
    FROM apps_story_sessions
    WHERE id = ?
  `).get(id);

  if (!session) return { status: 404, message: '故事不存在' };

  const turns = db.prepare(`
    SELECT id, turn_index, role, type, content, choices_json, summary, progress, created_at
    FROM apps_story_turns
    WHERE session_id = ?
    ORDER BY id ASC
  `).all(id);

  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      storyPrompt: session.story_prompt || '',
      summary: session.summary || '',
      progress: session.progress || '',
      totalChapters: session.total_chapters || 0,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    },
    turns: turns.map((t) => ({
      id: t.id,
      turnIndex: t.turn_index,
      role: t.role,
      type: t.type,
      content: t.content,
      choices: (() => {
        try { return JSON.parse(t.choices_json || '[]'); } catch { return []; }
      })(),
      summary: t.summary || '',
      progress: t.progress || '',
      createdAt: t.created_at
    }))
  };
};
