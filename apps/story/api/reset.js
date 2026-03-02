import { db } from '../db.js';

export const resetHandler = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: 'sessionId 无效' };

  const session = db.prepare('SELECT id FROM apps_story_sessions WHERE id = ?').get(id);
  if (!session) return { status: 404, message: '故事不存在' };

  db.prepare('DELETE FROM apps_story_chapters WHERE session_id = ?').run(id);
  db.prepare(`
    UPDATE apps_story_sessions
    SET summary = '', progress = '第0章', chapter_count = 0, updated_at = datetime('now')
    WHERE id = ?
  `).run(id);

  return { success: true };
};
