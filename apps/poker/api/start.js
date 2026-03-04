import { db } from '../db.js';

const SUITS = ['spade', 'heart', 'diamond', 'club'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const shuffle = () => {
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const startHandler = () => {
  const deck = shuffle();
  const playerCards = deck.slice(0, 3);
  const aiCards = deck.slice(3, 6);
  const ante = 10;

  const ret = db.prepare(`
    INSERT INTO apps_poker_games (player_cards, ai_cards, player_chips, ai_chips, pot, round, status)
    VALUES (?, ?, ?, ?, ?, 1, 'playing')
  `).run(JSON.stringify(playerCards), JSON.stringify(aiCards), 1000 - ante, 1000 - ante, ante * 2);

  return {
    success: true,
    game: {
      id: ret.lastInsertRowid,
      playerCards,
      aiCards: [null, null, null],
      playerChips: 1000 - ante,
      aiChips: 1000 - ante,
      pot: ante * 2,
      round: 1,
      status: 'playing'
    }
  };
};
