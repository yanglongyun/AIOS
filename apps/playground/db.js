import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'playground.db'));
db.pragma('journal_mode = WAL');

export const initPlaygroundDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS playground_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '未命名场景',
      prompt TEXT DEFAULT '',
      html TEXT NOT NULL,
      suggestions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
