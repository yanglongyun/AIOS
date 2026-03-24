import { db } from './client.ts';

const detectDefaultLanguage = () => {
  const locale = String(Intl.DateTimeFormat().resolvedOptions().locale || '').toLowerCase();
  return locale.startsWith('zh') ? 'zh' : 'en';
};

export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      title TEXT,
      description TEXT DEFAULT '',
      scene TEXT NOT NULL DEFAULT 'chat',
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT,
      schedule_id TEXT,
      app TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'agent',
      prompt TEXT NOT NULL,
      schema TEXT,
      meta TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      run_at TEXT,
      cron TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_run_at TEXT,
      last_task_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_seen_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

  `);

  db.prepare(`
    INSERT OR IGNORE INTO settings (key, value)
    VALUES ('language', ?)
  `).run(detectDefaultLanguage());
};
