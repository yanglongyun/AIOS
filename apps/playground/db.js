import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
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
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
