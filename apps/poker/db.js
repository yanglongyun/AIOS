import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'poker.db'));
db.pragma('journal_mode = WAL');

export const initPokerDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_poker_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_cards TEXT NOT NULL DEFAULT '[]',
      ai_cards TEXT NOT NULL DEFAULT '[]',
      player_chips INTEGER NOT NULL DEFAULT 1000,
      ai_chips INTEGER NOT NULL DEFAULT 1000,
      pot INTEGER NOT NULL DEFAULT 0,
      round INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'playing',
      winner TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
