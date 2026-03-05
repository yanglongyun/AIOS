import { createAppDb } from '../app_shared/db/createAppDb.js';

export const db = createAppDb('blackroom.db');

export const initBlackroomDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_blackroom_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint TEXT NOT NULL DEFAULT '',
      poop_count INTEGER NOT NULL DEFAULT 0,
      agent_response TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};

