import { createAppDb } from '../app_shared/db/createAppDb.js';

export const db = createAppDb('inbox.db');

export const initInboxDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      source_ip TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      reply_suggestion TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
