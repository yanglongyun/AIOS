import { existsSync, readFileSync } from "fs";
import { join } from "path";
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

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      creator TEXT NOT NULL DEFAULT 'user',
      pinned INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

const stripFrontmatter = (text) => {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith("---")) return trimmed;
  const end = trimmed.indexOf("---", 3);
  if (end === -1) return trimmed;
  return trimmed.slice(end + 3).trimStart();
};

const seedMemoriesIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM memories").get().c;
  if (count !== 0) return;
  try {
    const root = process.cwd();
    const locale = (() => {
      try { return JSON.parse(readFileSync(join(root, ".aios", "settings.json"), "utf8")).locale || "zh"; } catch { return "zh"; }
    })();
    const filePath = join(root, "language", locale, "memory", "app-creation-guide.md");
    if (!existsSync(filePath)) return;
    const raw = readFileSync(filePath, "utf8");
    const content = stripFrontmatter(raw).trim();
    if (content) {
      db.prepare(
        "INSERT INTO memories (title, description, content, creator, pinned) VALUES (?, ?, ?, ?, ?)"
      ).run("__T_MEMORY_SEED_TITLE__", "__T_MEMORY_SEED_DESC__", content, "system", 0);
    }
  } catch {}
};

const initDatabase = () => {
  createTables();
  seedMemoriesIfEmpty();
};

export {
  initDatabase
};
