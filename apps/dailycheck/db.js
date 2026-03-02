import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'dailycheck.db'));
db.pragma('journal_mode = WAL');

export const initDailycheckDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_dailycheck_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL DEFAULT '',
      response TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
