import { db } from './client.js';

export const initNokiaDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_nokia_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_screen TEXT NOT NULL DEFAULT '{}',
      screen_history TEXT DEFAULT '{}',
      battery_level INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
