import { db } from './client.js';

export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      title TEXT,
      description TEXT DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      reply TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      read_at TEXT
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

  const taskCols = db.prepare(`PRAGMA table_info(tasks)`).all();
  const hasTitle = taskCols.some((c) => c.name === 'title');
  const hasMode = taskCols.some((c) => c.name === 'mode');
  const hasSchema = taskCols.some((c) => c.name === 'schema');
  const hasMeta = taskCols.some((c) => c.name === 'meta');
  if (!hasTitle) db.exec(`ALTER TABLE tasks ADD COLUMN title TEXT NOT NULL DEFAULT ''`);
  if (!hasMode) db.exec(`ALTER TABLE tasks ADD COLUMN mode TEXT NOT NULL DEFAULT 'agent'`);
  if (!hasSchema) db.exec(`ALTER TABLE tasks ADD COLUMN schema TEXT`);
  if (!hasMeta) db.exec(`ALTER TABLE tasks ADD COLUMN meta TEXT`);
};
