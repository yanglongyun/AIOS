import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'blackroom.db'));
db.pragma('journal_mode = WAL');

export const initBlackroomDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_blackroom_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint TEXT NOT NULL DEFAULT '',
      poop_count INTEGER NOT NULL DEFAULT 0,
      agent_response TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};

