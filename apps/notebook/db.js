import { db } from '../db/client.js';

export const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

export const listNotebookNotes = () => {
  return db.prepare('SELECT * FROM apps_notes ORDER BY id DESC').all();
};

export const createNotebookNote = (content = '') => {
  const r = db.prepare('INSERT INTO apps_notes (content, updated_at) VALUES (?, datetime(\'now\'))').run(content);
  return { id: r.lastInsertRowid };
};

export const updateNotebookNote = (id, content = '') => {
  db.prepare('UPDATE apps_notes SET content = ?, updated_at = datetime(\'now\') WHERE id = ?').run(content, id);
  return { ok: true };
};

export const deleteNotebookNote = (id) => {
  db.prepare('DELETE FROM apps_notes WHERE id = ?').run(id);
  return { ok: true };
};
