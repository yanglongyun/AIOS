import { db } from "./client.js";

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

    CREATE TABLE IF NOT EXISTS cc_conversations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id      TEXT NOT NULL UNIQUE,
      cwd             TEXT NOT NULL DEFAULT '',
      permission_mode TEXT NOT NULL DEFAULT 'default',
      title           TEXT NOT NULL DEFAULT '',
      message_count   INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cc_events (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES cc_conversations(id) ON DELETE CASCADE,
      seq             INTEGER NOT NULL,
      kind            TEXT NOT NULL,
      raw_json        TEXT NOT NULL,
      ts              TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cc_events_conv_seq ON cc_events(conversation_id, seq);

    CREATE TABLE IF NOT EXISTS notes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      pinned      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_notes_pinned_updated
      ON notes(pinned DESC, updated_at DESC);

    CREATE TABLE IF NOT EXISTS memories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      enabled     INTEGER NOT NULL DEFAULT 1,
      pinned      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_memories_enabled_pinned_updated
      ON memories(enabled DESC, pinned DESC, updated_at DESC);
  `);
};

// 一次性迁移:把旧 contexts 表里 source='memory' 的行搬进 memories 表,然后 DROP 旧表。
// 只对 contexts 表仍然存在的旧库生效;新库已经没有 contexts 表,这一步是 no-op。
const migrateMemoriesFromContexts = () => {
  const tableExists = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='contexts'"
  ).get();
  if (!tableExists) return;
  try {
    db.exec(`
      INSERT INTO memories (title, description, content, enabled, pinned, created_at, updated_at)
      SELECT
        COALESCE(title, ''),
        COALESCE(summary, ''),
        COALESCE(content, ''),
        CASE WHEN access = 'none' THEN 0 ELSE 1 END,
        COALESCE(pinned, 0),
        COALESCE(created_at, datetime('now')),
        COALESCE(updated_at, datetime('now'))
      FROM contexts
      WHERE source = 'memory';
      DROP TABLE contexts;
    `);
  } catch (err) {
    console.warn("[db] migrateMemoriesFromContexts skipped:", err?.message || err);
  }
};

const initDatabase = () => {
  createTables();
  migrateMemoriesFromContexts();
};

export {
  initDatabase
};
