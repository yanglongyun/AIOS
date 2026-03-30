import { db } from "./client.js";
const insertSession = ({ title, premise }) => {
  const ret = db.prepare(`
    INSERT INTO reader_sessions (title, premise, summary, progress, chapter_count, created_at, updated_at)
    VALUES (?, ?, '', '\u7B2C0\u7AE0', 0, datetime('now'), datetime('now'))
  `).run(title, premise);
  return db.prepare(`
    SELECT id, title, premise, summary, progress, chapter_count, created_at, updated_at
    FROM reader_sessions
    WHERE id = ?
  `).get(ret.lastInsertRowid);
};
export {
  insertSession
};
