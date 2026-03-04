import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'inbox.db'));
db.pragma('journal_mode = WAL');

export const initInboxDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      source_ip TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      reply_suggestion TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // migration: add reply_suggestion column
  const cols = db.prepare("PRAGMA table_info(inbox_messages)").all();
  if (!cols.find(c => c.name === 'reply_suggestion')) {
    db.exec("ALTER TABLE inbox_messages ADD COLUMN reply_suggestion TEXT DEFAULT ''");
  }
};
