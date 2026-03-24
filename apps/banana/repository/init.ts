import { db } from './client.ts';

export const initBananaDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS banana_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_screen TEXT NOT NULL DEFAULT '{}',
      screen_history TEXT DEFAULT '{}',
      battery_level INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
