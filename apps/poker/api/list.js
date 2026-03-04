import { db } from '../db.js';

export const listHandler = (query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(query.pageSize || 20)));
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_poker_games').get().c;
  const items = db.prepare(`
    SELECT id, player_chips AS playerChips, ai_chips AS aiChips, pot, round, status, winner, created_at AS createdAt
    FROM apps_poker_games ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  return { success: true, items, total, page, pageSize };
};
