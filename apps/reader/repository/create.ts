import { db } from './client.ts';

export const insertSession = ({ title, premise }) => {
  const ret = db.prepare(`
    INSERT INTO reader_sessions (title, premise, summary, progress, chapter_count, created_at, updated_at)
    VALUES (?, ?, '', '第0章', 0, datetime('now'), datetime('now'))
  `).run(title, premise);

  return db.prepare(`
    SELECT id, title, premise, summary, progress, chapter_count, created_at, updated_at
    FROM reader_sessions
    WHERE id = ?
  `).get(ret.lastInsertRowid);
};
