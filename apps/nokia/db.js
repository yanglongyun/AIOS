import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'nokia.db'));
db.pragma('journal_mode = WAL');

export const initNokiaDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_nokia_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_screen TEXT NOT NULL DEFAULT '{}',
      screen_history TEXT DEFAULT '{}',
      battery_level INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};
