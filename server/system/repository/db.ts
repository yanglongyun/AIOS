// @ts-nocheck
import fs from "fs";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../../database/agent.db");
const DB_DIR = path.dirname(DB_PATH);

let db;

const initDb = () => {
  if (db) return db;

  fs.mkdirSync(DB_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      usage TEXT,
      meta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      creator TEXT NOT NULL DEFAULT 'user',
      visibility TEXT NOT NULL DEFAULT 'hidden',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      kind TEXT NOT NULL DEFAULT 'task',
      source_id TEXT,
      event TEXT NOT NULL DEFAULT 'done',
      target_mode TEXT NOT NULL DEFAULT 'existing_chat',
      conversation_id TEXT,
      chat_title TEXT,
      prompt TEXT,
      created_by_type TEXT,
      created_by_ref TEXT,
      delivered_message_id INTEGER,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      fired_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_chats_conversation ON chats(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_conversation ON tasks(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_memories_enabled_visibility ON memories(enabled, visibility);
    CREATE INDEX IF NOT EXISTS idx_monitors_source ON monitors(kind, source_id, event, status);
    CREATE INDEX IF NOT EXISTS idx_monitors_conversation ON monitors(conversation_id, status, id DESC);
  `);

  return db;
};

const getDb = () => initDb();

export { getDb, initDb };
