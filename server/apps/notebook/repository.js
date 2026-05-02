import { createAppDb } from "../app_shared/db/createAppDb.js";
import { deleteContext, normalizeAccess, upsertContext } from "../../main/repository/context.js";

const db = createAppDb("notebook.db");

const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      icon       TEXT,
      cover      TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id  INTEGER,
      title      TEXT    NOT NULL,
      icon       TEXT,
      cover      TEXT,
      summary    TEXT    NOT NULL DEFAULT '',
      content    TEXT    NOT NULL DEFAULT '',
      access     TEXT    NOT NULL DEFAULT 'none',
      pinned     INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notes_pinned    ON notes(pinned);
    CREATE INDEX IF NOT EXISTS idx_notes_updated   ON notes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_notes_folder    ON notes(folder_id);
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
    access: note.access
  });
};

// ---- Folders -----------------------------------------------------------

const rowToFolder = (row) => row && ({
  id: row.id,
  name: row.name,
  icon: row.icon || null,
  cover: row.cover || null,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listFolders = () =>
  db.prepare("SELECT * FROM folders ORDER BY sort_order ASC, id ASC").all().map(rowToFolder);

const getFolder = (id) => rowToFolder(
  db.prepare("SELECT * FROM folders WHERE id = ?").get(id)
);

const createFolder = ({ name, icon = null, cover = null }) => {
  const info = db.prepare("INSERT INTO folders (name, icon, cover) VALUES (?, ?, ?)").run(name, icon, cover);
  return getFolder(info.lastInsertRowid);
};

const updateFolder = (patch) => {
  const { id, ...rest } = patch;
  const fields = [];
  const values = [];
  if (rest.name !== undefined) { fields.push("name = ?"); values.push(rest.name); }
  if (rest.icon !== undefined) { fields.push("icon = ?"); values.push(rest.icon); }
  if (rest.cover !== undefined) { fields.push("cover = ?"); values.push(rest.cover); }
  if (!fields.length) return getFolder(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE folders SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  return getFolder(id);
};

const deleteFolder = ({ id }) => {
  const tx = db.transaction(() => {
    db.prepare("UPDATE notes SET folder_id = NULL, updated_at = datetime('now') WHERE folder_id = ?").run(id);
    return db.prepare("DELETE FROM folders WHERE id = ?").run(id).changes;
  });
  return { deleted: tx() };
};

// ---- Notes -------------------------------------------------------------

const rowToNote = (row) => row && ({
  id: row.id,
  folderId: row.folder_id ?? null,
  title: row.title,
  icon: row.icon || null,
  cover: row.cover || null,
  summary: row.summary || "",
  content: row.content,
  access: row.access || "none",
  pinned: Boolean(row.pinned),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const listNotes = ({ folderId } = {}) => {
  if (folderId !== undefined && folderId !== null) {
    return db.prepare(
      "SELECT * FROM notes WHERE folder_id = ? ORDER BY pinned DESC, sort_order ASC, updated_at DESC, id DESC"
    ).all(folderId).map(rowToNote);
  }
  return db.prepare(
    "SELECT * FROM notes ORDER BY pinned DESC, sort_order ASC, updated_at DESC, id DESC"
  ).all().map(rowToNote);
};

const getNote = (id) => rowToNote(
  db.prepare("SELECT * FROM notes WHERE id = ?").get(id)
);

const createNote = ({ title, icon = null, cover = null, summary = "", content = "", access = "none", folderId = null }) => {
  const info = db.prepare(
    "INSERT INTO notes (title, icon, cover, summary, content, access, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(title, icon, cover, summary, content, normalizeAccess(access), folderId);
  const note = getNote(info.lastInsertRowid);
  syncNoteContext(note);
  return note;
};

const updateNote = ({ id, title, icon, cover, summary, content, access, pinned, folderId, sortOrder }) => {
  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push("title = ?"); values.push(title); }
  if (icon !== undefined) { fields.push("icon = ?"); values.push(icon); }
  if (cover !== undefined) { fields.push("cover = ?"); values.push(cover); }
  if (summary !== undefined) { fields.push("summary = ?"); values.push(summary); }
  if (content !== undefined) { fields.push("content = ?"); values.push(content); }
  if (access !== undefined) { fields.push("access = ?"); values.push(normalizeAccess(access)); }
  if (pinned !== undefined) { fields.push("pinned = ?"); values.push(pinned ? 1 : 0); }
  if (folderId !== undefined) { fields.push("folder_id = ?"); values.push(folderId); }
  if (sortOrder !== undefined) { fields.push("sort_order = ?"); values.push(sortOrder); }
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
  listFolders, getFolder, createFolder, updateFolder, deleteFolder,
  listNotes, getNote, createNote, updateNote, deleteNote,
};
