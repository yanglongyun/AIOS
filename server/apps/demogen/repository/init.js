import { db } from "./client.js";

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS demogen_projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      feature     TEXT NOT NULL DEFAULT '',
      stack       TEXT NOT NULL DEFAULT 'HTML + CSS + JS 单文件，直接浏览器打开',
      constraints TEXT NOT NULL DEFAULT '',
      plan_count  INTEGER NOT NULL DEFAULT 4,
      status      TEXT NOT NULL DEFAULT 'draft',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS demogen_works (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL REFERENCES demogen_projects(id) ON DELETE CASCADE,
      plan_id     TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL DEFAULT '',
      angle       TEXT NOT NULL DEFAULT '',
      audience    TEXT NOT NULL DEFAULT '',
      layout      TEXT NOT NULL DEFAULT '',
      interactions TEXT NOT NULL DEFAULT '[]',
      files       TEXT NOT NULL DEFAULT '["index.html"]',
      task_id     INTEGER,
      batch       TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'idle',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_demogen_works_project
      ON demogen_works(project_id, id ASC);
  `);
};

export { initDatabase };
