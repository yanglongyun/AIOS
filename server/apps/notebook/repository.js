import { createAppDb } from "../app_shared/db/createAppDb.js";

const db = createAppDb("notebook.db");

const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      content     TEXT NOT NULL DEFAULT '',
      pinned      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned);
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
  `);
};

const rowToNote = (row) => row && ({
  id: row.id,
  title: row.title,
  content: row.content,
  pinned: Boolean(row.pinned),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listNotes = () => {
  const rows = db.prepare(`
    SELECT * FROM notes
    ORDER BY pinned DESC, updated_at DESC, id DESC
  `).all();
  return rows.map(rowToNote);
};

const getNote = (id) => rowToNote(
  db.prepare("SELECT * FROM notes WHERE id = ?").get(id)
);

const createNote = ({ title, content = "" }) => {
  const info = db.prepare(
    "INSERT INTO notes (title, content) VALUES (?, ?)"
  ).run(title, content);
  return getNote(info.lastInsertRowid);
};

const updateNote = ({ id, title, content, pinned }) => {
  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push("title = ?"); values.push(title); }
  if (content !== undefined) { fields.push("content = ?"); values.push(content); }
  if (pinned !== undefined) { fields.push("pinned = ?"); values.push(pinned ? 1 : 0); }
  if (!fields.length) return getNote(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE notes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getNote(id);
};

const deleteNote = ({ id }) => {
  const info = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return { deleted: info.changes };
};

export {
  initNotebookDatabase,
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
};
