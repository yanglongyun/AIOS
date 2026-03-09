import { db } from './client.js';
import { toDateKey } from '../../../shared/time/dateKey.js';

export const persistEquity = (equity) => {
  db.prepare("INSERT INTO apps_cryptobot_equity (equity, created_at) VALUES (?, datetime('now'))").run(equity);
};

export const listEquity = (limit = 300) => {
  const size = Math.min(1000, Math.max(10, parseInt(limit) || 300));
  return db.prepare('SELECT id, equity, created_at FROM apps_cryptobot_equity ORDER BY id DESC LIMIT ?').all(size).reverse();
};

export const getTodayChange = (currentEquity) => {
  const todayStr = toDateKey();
  const first = db.prepare("SELECT equity FROM apps_cryptobot_equity WHERE date(created_at) = ? ORDER BY id ASC LIMIT 1").get(todayStr);
  if (!first) return 0;
  return currentEquity - first.equity;
};
