import { db } from "./client.js";

const initDatabase = () => {
  // 重建：旧版 schema 字段(layout/audience/interactions/files)已废弃，
  // 且缺少 dir_path/entry_path，无法支撑预览与对比，直接重建到当前最终 schema。
  db.exec(`
    DROP TABLE IF EXISTS demogen_works;
    DROP TABLE IF EXISTS demogen_projects;

    CREATE TABLE demogen_projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      feature     TEXT NOT NULL DEFAULT '',
      stack       TEXT NOT NULL DEFAULT '单文件 HTML（内联 CSS/JS，浏览器直接打开）',
      constraints TEXT NOT NULL DEFAULT '',
      plan_count  INTEGER NOT NULL DEFAULT 4,
      status      TEXT NOT NULL DEFAULT 'draft',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE demogen_works (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER NOT NULL REFERENCES demogen_projects(id) ON DELETE CASCADE,
      plan_id     TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL DEFAULT '',
      angle       TEXT NOT NULL DEFAULT '',
      highlights  TEXT NOT NULL DEFAULT '[]',
      dir_path    TEXT NOT NULL DEFAULT '',
      entry_path  TEXT NOT NULL DEFAULT '',
      task_id     INTEGER,
      batch       TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'idle',
      error       TEXT NOT NULL DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_demogen_works_project
      ON demogen_works(project_id, id ASC);
  `);
};

export { initDatabase };
