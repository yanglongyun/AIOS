import { db } from '../db.js';

export const createHandler = (body = {}) => {
  const title = String(body.title || '').trim() || '未命名故事';
  const premise = String(body.premise || '').trim();

  const ret = db.prepare(`
    INSERT INTO apps_story_sessions (title, premise, summary, progress, chapter_count, created_at, updated_at)
    VALUES (?, ?, '', '第0章', 0, datetime('now'), datetime('now'))
  `).run(title, premise);

  const session = db.prepare(`
    SELECT id, title, premise, summary, progress, chapter_count, created_at, updated_at
    FROM apps_story_sessions
    WHERE id = ?
  `).get(ret.lastInsertRowid);

  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      premise: session.premise,
      summary: session.summary,
      progress: session.progress,
      chapterCount: session.chapter_count,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }
  };
};
