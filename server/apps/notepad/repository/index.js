// @ts-nocheck
// 记事本数据层:建库、迁移、全部 SQL。
import { createAppDb } from "../../shared/db.js";

let db;

const FOLDER_SEEDS = [
  ["工作", "#a06c3a"],
  ["生活", "#5b8a4e"],
  ["灵感", "#b0719a"],
];

const hasColumn = (table, name) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === name);

const migrate = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#a06c3a'
    );
  `);
  if (!hasColumn("notes", "folder")) db.exec("ALTER TABLE notes ADD COLUMN folder TEXT NOT NULL DEFAULT ''");
  if (!hasColumn("notes", "tags")) db.exec("ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
  if (!hasColumn("notes", "pinned")) db.exec("ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
  if (!hasColumn("notes", "emoji")) db.exec("ALTER TABLE notes ADD COLUMN emoji TEXT NOT NULL DEFAULT ''");
  if (!hasColumn("notes", "color")) db.exec("ALTER TABLE notes ADD COLUMN color TEXT NOT NULL DEFAULT ''");
  const count = db.prepare("SELECT COUNT(*) AS n FROM folders").get().n;
  if (!count) {
    const stmt = db.prepare("INSERT OR IGNORE INTO folders (name, color) VALUES (?, ?)");
    for (const [name, color] of FOLDER_SEEDS) stmt.run(name, color);
  }
};

const initDb = () => {
  if (db) return db;
  db = createAppDb("notepad.db");
  migrate();
  return db;
};

const selectFolders = () => db.prepare("SELECT * FROM folders ORDER BY id ASC").all();

const selectNotes = () =>
  db.prepare(`
    SELECT * FROM notes
    ORDER BY pinned DESC, datetime(updated_at) DESC, id DESC
  `).all();

const selectNote = (id) => db.prepare("SELECT * FROM notes WHERE id = ?").get(Number(id));

const insertFolder = (name, color) =>
  db.prepare("INSERT INTO folders (name, color) VALUES (?, ?) RETURNING *").get(name, color);

const insertNote = ({ title, content, folder, tags, pinned, emoji, color }) =>
  db.prepare(`
    INSERT INTO notes (title, content, folder, tags, pinned, emoji, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(title, content, folder, tags, pinned, emoji, color);

const updateNoteRow = (id, { title, content, folder, tags, pinned, emoji, color }) =>
  db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, folder = ?, tags = ?, pinned = ?, emoji = ?, color = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(title, content, folder, tags, pinned, emoji, color, Number(id));

const deleteNoteRow = (id) => db.prepare("DELETE FROM notes WHERE id = ?").run(Number(id));

export { initDb, selectFolders, selectNotes, selectNote, insertFolder, insertNote, updateNoteRow, deleteNoteRow };
