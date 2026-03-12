import { db } from './client.js';

export const findSessionExists = (sessionId) => {
  return db.prepare('SELECT id FROM reader_sessions WHERE id = ?').get(sessionId);
};

export const deleteChaptersAndResetSession = (sessionId) => {
  db.prepare('DELETE FROM reader_chapters WHERE session_id = ?').run(sessionId);
  db.prepare(`
    UPDATE reader_sessions
    SET summary = '', progress = '第0章', chapter_count = 0, updated_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);
};
