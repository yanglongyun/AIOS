import { db } from './client.ts';

export const findAllSessions = () => {
  return db.prepare(`
    SELECT id, title, summary, progress, chapter_count, updated_at, created_at
    FROM reader_sessions
    ORDER BY id DESC
  `).all();
};
