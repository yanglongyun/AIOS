import { db } from './client.js';

export const initSubscriberDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriber_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      focus TEXT NOT NULL DEFAULT '',
      schedule_time TEXT NOT NULL DEFAULT '08:00',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriber_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      focus TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // migrate: add schedule_time if missing
  try {
    db.exec(`ALTER TABLE subscriber_profile ADD COLUMN schedule_time TEXT NOT NULL DEFAULT '08:00'`);
  } catch { /* column already exists */ }
};
