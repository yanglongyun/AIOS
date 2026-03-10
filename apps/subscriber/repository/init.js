import { db } from './client.js';

export const initSubscriberDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_subscriber_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      focus TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS apps_subscriber_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      focus TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
