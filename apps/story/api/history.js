import { db } from '../db.js';
import { parseJson } from '../../../shared/json/parse.js';

export const historyHandler = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: 'sessionId 无效' };

  const session = db.prepare(`
    SELECT id, title, premise, summary, progress, chapter_count, created_at, updated_at
    FROM apps_story_sessions
    WHERE id = ?
  `).get(id);
  if (!session) return { status: 404, message: '故事不存在' };

  const chapters = db.prepare(`
    SELECT id, idx, action, content, choices_json, summary, progress, created_at
    FROM apps_story_chapters
    WHERE session_id = ?
    ORDER BY idx ASC
  `).all(id);

  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      premise: session.premise || '',
      summary: session.summary || '',
      progress: session.progress || '',
      chapterCount: session.chapter_count || 0,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    },
    chapters: chapters.map((c) => ({
      id: c.id,
      idx: c.idx,
      action: c.action || '',
      content: c.content || '',
      choices: parseJson(c.choices_json || '[]', []),
      summary: c.summary || '',
      progress: c.progress || '',
      createdAt: c.created_at
    }))
  };
};
