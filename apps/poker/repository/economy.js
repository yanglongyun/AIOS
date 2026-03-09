import { db } from './client.js';
import { toDateKey } from '../../../shared/time/dateKey.js';

export const DAILY_GRANT = 1000;

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
