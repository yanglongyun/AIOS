import { db } from './client.js';

export const insertGame = ({ playerCards, aiCards, actionHistory, playerChips, aiChips, pot }) => {
  return db.prepare(`
    INSERT INTO poker_games (player_cards, ai_cards, action_history, player_chips, ai_chips, pot, round, status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'playing')
  `).run(JSON.stringify(playerCards), JSON.stringify(aiCards), JSON.stringify(actionHistory), playerChips, aiChips, pot);
};

export const getGameById = (id) => {
  return db.prepare('SELECT * FROM poker_games WHERE id = ?').get(id);
};

export const updateGame = ({ id, playerChips, aiChips, pot, round, status, winner, actionHistory }) => {
  db.prepare(`
    UPDATE poker_games
    SET player_chips=?, ai_chips=?, pot=?, round=?, status=?, winner=?, action_history=?
    WHERE id=?
  `).run(playerChips, aiChips, pot, round, status, winner, JSON.stringify(actionHistory), id);
};

export const listGames = ({ pageSize, offset }) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM poker_games').get().c;
  const items = db.prepare(`
    SELECT id, player_chips AS playerChips, ai_chips AS aiChips, pot, round, status, winner, created_at AS createdAt
    FROM poker_games ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  return { items, total };
};
