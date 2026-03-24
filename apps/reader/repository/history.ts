import { db } from './client.ts';

export const findSessionWithChapters = (sessionId) => {
  const session = db.prepare(`
    SELECT id, title, premise, summary, progress, chapter_count, created_at, updated_at
    FROM reader_sessions
    WHERE id = ?
  `).get(sessionId);

  if (!session) return null;

  const chapters = db.prepare(`
    SELECT id, idx, action, content, choices_json, summary, progress, created_at
    FROM reader_chapters
    WHERE session_id = ?
    ORDER BY idx ASC
  `).all(sessionId);

  return { session, chapters };
};
