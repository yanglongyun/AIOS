import { db } from './client.js';

export const initBeachDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_beach_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL DEFAULT '',
      ai_response TEXT NOT NULL DEFAULT '',
      ai_reaction TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
