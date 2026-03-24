import type { AnyRecord } from '../../../shared/types.ts';
import { getGameById } from '../repository/game.ts';
import { getPokerEconomy } from '../repository/economy.ts';

export const getGameState = (query: AnyRecord = {}) => {
  const id = Number(query.id || 0);
  if (!id) return { status: 400, message: '缺少 id' };

  const row = getGameById(id);
  if (!row) return { status: 404, message: '牌局不存在' };

  const playerCards = JSON.parse(row.player_cards);
  const aiCards = JSON.parse(row.ai_cards);

  return {
    success: true,
    game: {
      id: row.id,
      playerCards,
      aiCards: row.status === 'done' ? aiCards : [null, null, null],
      playerChips: row.player_chips,
      aiChips: row.ai_chips,
      pot: row.pot,
      round: row.round,
      status: row.status,
      winner: row.winner
    },
    economy: getPokerEconomy()
  };
};
