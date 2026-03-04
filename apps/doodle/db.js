import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'doodle.db'));
db.pragma('journal_mode = WAL');

export const initDoodleDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_doodle_works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_path TEXT NOT NULL DEFAULT '',
      edited_path TEXT NOT NULL DEFAULT '',
      prompt TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
