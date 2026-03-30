import { getGameById } from "../repository/game.js";
import { getPokerEconomy } from "../repository/economy.js";
const getGameState = (query = {}) => {
  const id = Number(query.id || 0);
  if (!id) return { status: 400, message: "\u7F3A\u5C11 id" };
  const row = getGameById(id);
  if (!row) return { status: 404, message: "\u724C\u5C40\u4E0D\u5B58\u5728" };
  const playerCards = JSON.parse(row.player_cards);
  const aiCards = JSON.parse(row.ai_cards);
  return {
    success: true,
    game: {
      id: row.id,
      playerCards,
      aiCards: row.status === "done" ? aiCards : [null, null, null],
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
export {
  getGameState
};
