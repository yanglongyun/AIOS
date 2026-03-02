import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'writerpad.db'));
db.pragma('journal_mode = WAL');

export const initWriterpadDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_writerpad_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '写字板',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_writerpad_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'global',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_apps_writerpad_messages_doc_created
    ON apps_writerpad_messages (doc_id, created_at);
  `);
};
