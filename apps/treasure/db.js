import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'treasure.db'));
db.pragma('journal_mode = WAL');

export const initTreasureDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_treasures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      condition_text TEXT NOT NULL DEFAULT '',
      summary_tag TEXT NOT NULL DEFAULT '',
      value REAL NOT NULL DEFAULT 0,
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
