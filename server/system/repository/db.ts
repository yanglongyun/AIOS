// @ts-nocheck
import fs from "fs";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../../database/system.db");
const DB_DIR = path.dirname(DB_PATH);

let db;

const createSchema = (database) => {
  database.exec(`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT NOT NULL DEFAULT '',
      scene TEXT NOT NULL DEFAULT 'chat',
      meta TEXT,
      state TEXT NOT NULL DEFAULT 'idle',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('user', 'ai', 'tool', 'subscription')),
      message TEXT NOT NULL,
      usage TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      chat_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      fired_at TEXT
    );

    CREATE INDEX idx_messages_chat ON messages(chat_id, id);
    CREATE INDEX idx_tasks_chat ON tasks(chat_id, id);
    CREATE INDEX idx_tasks_status ON tasks(status, id);
    CREATE INDEX idx_subscriptions_task ON subscriptions(task_id, status, id);
    CREATE INDEX idx_subscriptions_chat ON subscriptions(chat_id, status, id);
  `);
};

const initDb = () => {
  if (db) return db;

  fs.mkdirSync(DB_DIR, { recursive: true });
  const shouldCreateSchema = !fs.existsSync(DB_PATH);
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  if (shouldCreateSchema) createSchema(db);

  return db;
};

const getDb = () => initDb();

export { getDb, initDb };
