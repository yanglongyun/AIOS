import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'fortune.db'));
db.pragma('journal_mode = WAL');

export const initFortuneDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_fortune_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL DEFAULT '',
      sign_name TEXT NOT NULL DEFAULT '',
      sign_poem TEXT NOT NULL DEFAULT '',
      good TEXT NOT NULL DEFAULT '',
      bad TEXT NOT NULL DEFAULT '',
      advice TEXT NOT NULL DEFAULT '',
      hexagram TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  try { db.exec(`ALTER TABLE apps_fortune_records ADD COLUMN hexagram TEXT NOT NULL DEFAULT ''`); } catch(e) {}
};
