import { db } from '../../db.js';

export const listEquityHandler = ({ limit = 300 } = {}) => {
  const size = Math.min(1000, Math.max(10, parseInt(limit) || 300));
  const rows = db.prepare('SELECT id, equity, created_at FROM apps_cryptobot_equity ORDER BY id DESC LIMIT ?').all(size).reverse();
  return { success: true, points: rows };
};
