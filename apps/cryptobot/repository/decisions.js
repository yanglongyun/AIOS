import { db } from './client.js';

export const recordDecision = ({ action, reason, price, sizeCoin, amountUsdt, equityAfter }) => {
  db.prepare(`
    INSERT INTO apps_cryptobot_decisions (action, reason, price, size_coin, amount_usdt, equity_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(action, reason, price, sizeCoin, amountUsdt, equityAfter);
};

export const listDecisions = (limit = 50) => {
  const size = Math.min(200, Math.max(1, parseInt(limit) || 50));
  return db.prepare(`
    SELECT id, action, reason, price, size_coin, amount_usdt, equity_after, created_at
    FROM apps_cryptobot_decisions
    ORDER BY id DESC
    LIMIT ?
  `).all(size);
};

export const recentDecisions = (limit = 10) => {
  return db.prepare('SELECT * FROM apps_cryptobot_decisions ORDER BY id DESC LIMIT ?').all(limit).reverse();
};
