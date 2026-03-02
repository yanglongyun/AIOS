import { db } from '../../app_shared/db/client.js';

export const createHandler = (body = {}) => {
  const title = String(body.title || '').trim() || '未命名故事';
  const storyPrompt = String(body.story_prompt || '').trim();

  const ret = db.prepare(`
    INSERT INTO apps_story_sessions (
      title, story_prompt, summary, progress, total_chapters, created_at, updated_at
    ) VALUES (?, ?, '', '第0章', 0, datetime('now'), datetime('now'))
  `).run(title, storyPrompt);

  const session = db.prepare(`
    SELECT id, title, story_prompt, summary, progress, total_chapters, created_at, updated_at
    FROM apps_story_sessions
    WHERE id = ?
  `).get(ret.lastInsertRowid);

  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      storyPrompt: session.story_prompt,
      summary: session.summary,
      progress: session.progress,
      totalChapters: session.total_chapters,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    }
  };
};
