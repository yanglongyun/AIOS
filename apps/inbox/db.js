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
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
