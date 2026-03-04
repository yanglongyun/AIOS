import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'redmill.db'));
db.pragma('journal_mode = WAL');

export const initRedmillDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_redmill_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_redmill_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      page_index INTEGER NOT NULL DEFAULT 0,
      page_type TEXT NOT NULL DEFAULT 'content',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
