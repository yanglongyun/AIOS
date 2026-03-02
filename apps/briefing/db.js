import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'briefing.db'));
db.pragma('journal_mode = WAL');

export const initBriefingDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_briefing_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      focus TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS apps_briefing_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      focus TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      brief TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
