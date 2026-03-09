import { db } from './client.js';

export const initDailycheckDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_dailycheck_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL DEFAULT '',
      response TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
