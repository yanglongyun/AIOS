import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'mindtree.db'));
db.pragma('journal_mode = WAL');

export const initMindtreeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_mindtree_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '心树',
      data TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_mindtree_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outline_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_apps_mindtree_messages_outline_created
    ON apps_mindtree_messages (outline_id, created_at);
  `);
};
