import { db } from "./client.js";
import { seedMemories } from "./memory-seeds.js";

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
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conv_remark
      ON messages(conversation_id, id DESC) WHERE remark IS NOT NULL;

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
      payload TEXT NOT NULL,
      meta TEXT,
      response TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      finished_at TEXT
    );

    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      kind TEXT NOT NULL DEFAULT 'task',
      source_id TEXT,
      event TEXT NOT NULL DEFAULT 'done',
      target_mode TEXT NOT NULL DEFAULT 'existing_chat',
      conversation_id TEXT,
      chat_title TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      created_by_type TEXT NOT NULL DEFAULT 'ai',
      created_by_ref TEXT,
      delivered_message_id INTEGER,
      error TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      fired_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_monitors_source
      ON monitors(kind, source_id, event, status);
    CREATE INDEX IF NOT EXISTS idx_monitors_conversation
      ON monitors(conversation_id, status, id DESC);

    CREATE TABLE IF NOT EXISTS memories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      visibility  TEXT NOT NULL DEFAULT 'full',
      starred     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_memories_visibility_id
      ON memories(visibility, id DESC);
    CREATE INDEX IF NOT EXISTS idx_memories_starred_id
      ON memories(starred, id DESC);
  `);
};

const initDatabase = () => {
  createTables();
  seedMemories();
};

export {
  initDatabase
};
