import { createAppDb } from '../app_shared/db/createAppDb.js';

export const db = createAppDb('playground.db');

export const initPlaygroundDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS playground_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '未命名场景',
      prompt TEXT DEFAULT '',
      html TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
