import { dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      title TEXT,
      description TEXT DEFAULT '',
      scene TEXT NOT NULL DEFAULT 'chat',
      meta TEXT,
      state TEXT NOT NULL DEFAULT 'idle',
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

    CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      access TEXT NOT NULL DEFAULT 'none',
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(source, source_id)
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

    CREATE TABLE IF NOT EXISTS auth (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      api_token     TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
};

const initDatabase = () => {
  createTables();
};

export {
  initDatabase
};
