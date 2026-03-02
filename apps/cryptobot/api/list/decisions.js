import { db } from '../../db.js';

export const listDecisionsHandler = ({ limit = 50 } = {}) => {
  const size = Math.min(200, Math.max(1, parseInt(limit) || 50));
  const items = db.prepare(`
    SELECT id, action, reason, price, size_coin, amount_usdt, equity_after, created_at
    FROM apps_cryptobot_decisions
    ORDER BY id DESC
    LIMIT ?
  `).all(size);
  return { success: true, items };
};
