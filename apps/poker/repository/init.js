import { db } from './client.js';

export const initPokerDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_poker_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_cards TEXT NOT NULL DEFAULT '[]',
      ai_cards TEXT NOT NULL DEFAULT '[]',
      action_history TEXT NOT NULL DEFAULT '[]',
      player_chips INTEGER NOT NULL DEFAULT 1000,
      ai_chips INTEGER NOT NULL DEFAULT 1000,
      pot INTEGER NOT NULL DEFAULT 0,
      round INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'playing',
      winner TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_poker_accounts (
      role TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.prepare(`
    INSERT OR IGNORE INTO apps_poker_accounts (role, balance)
    VALUES ('player', 0)
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO apps_poker_accounts (role, balance)
    VALUES ('ai', 0)
  `).run();
};
