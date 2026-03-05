import { createAppDb } from '../app_shared/db/createAppDb.js';
import { toDateKey } from '../../shared/time/dateKey.js';

export const db = createAppDb('poker.db');

export const DAILY_GRANT = 1000;

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
      balance INTEGER NOT NULL DEFAULT 0,
      total_granted INTEGER NOT NULL DEFAULT 0,
      last_grant_date TEXT NOT NULL DEFAULT ''
    )
  `);
  db.prepare(`
    INSERT OR IGNORE INTO apps_poker_accounts (role, balance, total_granted, last_grant_date)
    VALUES ('player', 0, 0, '')
  `).run();
  db.prepare(`
    INSERT OR IGNORE INTO apps_poker_accounts (role, balance, total_granted, last_grant_date)
    VALUES ('ai', 0, 0, '')
  `).run();
};

export const grantDailyAllowanceIfNeeded = () => {
  const today = toDateKey();
  const roles = ['player', 'ai'];
  const granted = { player: 0, ai: 0 };

  const tx = db.transaction(() => {
    for (const role of roles) {
      const row = db.prepare(`
        SELECT role, balance, total_granted, last_grant_date
        FROM apps_poker_accounts
        WHERE role = ?
      `).get(role);
      if (!row) continue;
      if (String(row.last_grant_date || '') === today) continue;
      db.prepare(`
        UPDATE apps_poker_accounts
        SET balance = ?, total_granted = ?, last_grant_date = ?
        WHERE role = ?
      `).run(
        Number(row.balance || 0) + DAILY_GRANT,
        Number(row.total_granted || 0) + DAILY_GRANT,
        today,
        role
      );
      granted[role] = DAILY_GRANT;
    }
  });

  tx();
  return granted;
};

export const setPokerBalances = ({ playerBalance, aiBalance }) => {
  const tx = db.transaction(() => {
    db.prepare(`UPDATE apps_poker_accounts SET balance = ? WHERE role = 'player'`).run(Math.max(0, Number(playerBalance || 0)));
    db.prepare(`UPDATE apps_poker_accounts SET balance = ? WHERE role = 'ai'`).run(Math.max(0, Number(aiBalance || 0)));
  });
  tx();
};

export const getPokerEconomy = () => {
  const player = db.prepare(`SELECT balance FROM apps_poker_accounts WHERE role = 'player'`).get() || { balance: 0 };
  const ai = db.prepare(`SELECT balance FROM apps_poker_accounts WHERE role = 'ai'`).get() || { balance: 0 };
  return {
    playerBalance: Number(player.balance || 0),
    aiBalance: Number(ai.balance || 0)
  };
};
