import { createAppDb } from "../app_shared/db/createAppDb.js";
import { deleteContext, normalizeAccess, upsertContext } from "../../main/repository/context.js";

const db = createAppDb("notebook.db");

const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL DEFAULT '',
      summary    TEXT    NOT NULL DEFAULT '',
      content    TEXT    NOT NULL DEFAULT '',
      pinned     INTEGER NOT NULL DEFAULT 0,
      access     TEXT    NOT NULL DEFAULT 'none',
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notes_pinned  ON notes(pinned);
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at);
  `);
};

const syncNoteContext = (note) => {
  if (!note) return;
  upsertContext({
    source: "notebook",
    sourceId: note.id,
    title: note.title,
    summary: note.summary,
    content: note.content,
    access: note.access,
  });
};

const rowToNote = (row) => row && ({
  id:        row.id,
  title:     row.title || "",
  summary:   row.summary || "",
  content:   row.content || "",
  pinned:    Boolean(row.pinned),
  access:    row.access || "none",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listNotes = () =>
  db.prepare(
    "SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC, id DESC"
  ).all().map(rowToNote);

const getNote = (id) => rowToNote(
  db.prepare("SELECT * FROM notes WHERE id = ?").get(id)
);

const createNote = ({ title = "", summary = "", content = "", pinned = false, access = "none" }) => {
  const info = db.prepare(
    "INSERT INTO notes (title, summary, content, pinned, access) VALUES (?, ?, ?, ?, ?)"
  ).run(title, summary, content, pinned ? 1 : 0, normalizeAccess(access));
  const note = getNote(info.lastInsertRowid);
  syncNoteContext(note);
  return note;
};

const updateNote = ({ id, title, summary, content, pinned, access }) => {
  const fields = [];
  const values = [];
  if (title   !== undefined) { fields.push("title = ?");   values.push(title); }
  if (summary !== undefined) { fields.push("summary = ?"); values.push(summary); }
  if (content !== undefined) { fields.push("content = ?"); values.push(content); }
  if (pinned  !== undefined) { fields.push("pinned = ?");  values.push(pinned ? 1 : 0); }
  if (access  !== undefined) { fields.push("access = ?");  values.push(normalizeAccess(access)); }
  if (!fields.length) return getNote(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE notes SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  const note = getNote(id);
  syncNoteContext(note);
  return note;
};

const deleteNote = ({ id }) => {
  const info = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  deleteContext({ source: "notebook", sourceId: id });
  return { deleted: info.changes };
};

export {
  initNotebookDatabase,
  listNotes, getNote, createNote, updateNote, deleteNote,
};
