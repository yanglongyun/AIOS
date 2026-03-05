import { db, grantDailyAllowanceIfNeeded, getPokerEconomy, setPokerBalances } from '../db.js';

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
  const granted = grantDailyAllowanceIfNeeded();
  const economyBefore = getPokerEconomy();

  const deck = shuffle();
  const playerCards = deck.slice(0, 3);
  const aiCards = deck.slice(3, 6);
  const ante = 10;
  if (economyBefore.playerBalance < ante || economyBefore.aiBalance < ante) {
    return { status: 400, message: '一方筹码不足，无法开始新局' };
  }

  const playerChips = economyBefore.playerBalance - ante;
  const aiChips = economyBefore.aiBalance - ante;
  const actionHistory = [
    { actor: 'system', action: 'ante', amount: ante, text: `双方下底注 ${ante}` }
  ];

  setPokerBalances({ playerBalance: playerChips, aiBalance: aiChips });

  const ret = db.prepare(`
    INSERT INTO apps_poker_games (player_cards, ai_cards, action_history, player_chips, ai_chips, pot, round, status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'playing')
  `).run(JSON.stringify(playerCards), JSON.stringify(aiCards), JSON.stringify(actionHistory), playerChips, aiChips, ante * 2);

  const economy = getPokerEconomy();

  return {
    success: true,
    game: {
      id: ret.lastInsertRowid,
      playerCards,
      aiCards: [null, null, null],
      playerChips,
      aiChips,
      pot: ante * 2,
      round: 1,
      status: 'playing'
    },
    economy,
    grant: granted
  };
};
