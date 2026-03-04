import { db } from '../db.js';

const RANK_VALUE = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const handRank = (cards) => {
  const vals = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const sameSuit = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
  const sorted = [...vals].sort((a, b) => a - b);
  const straight = (sorted[2] - sorted[1] === 1 && sorted[1] - sorted[0] === 1) ||
    (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14);

  if (vals[0] === vals[1] && vals[1] === vals[2]) return { type: 6, vals };
  if (sameSuit && straight) return { type: 5, vals };
  if (sameSuit) return { type: 4, vals };
  if (straight) return { type: 3, vals };
  if (vals[0] === vals[1] || vals[1] === vals[2]) {
    const pair = vals[0] === vals[1] ? vals[0] : vals[1];
    const kicker = vals.find(v => v !== pair);
    return { type: 2, vals: [pair, kicker] };
  }
  return { type: 1, vals };
};

const compareHands = (a, b) => {
  const ra = handRank(a), rb = handRank(b);
  if (ra.type !== rb.type) return ra.type - rb.type;
  for (let i = 0; i < ra.vals.length; i++) {
    if (ra.vals[i] !== rb.vals[i]) return ra.vals[i] - rb.vals[i];
  }
  return 0;
};

export const actionHandler = (body = {}) => {
  const id = Number(body.id || 0);
  const action = String(body.action || '');
  if (!id) return { status: 400, message: '缺少 id' };

  const row = db.prepare('SELECT * FROM apps_poker_games WHERE id = ?').get(id);
  if (!row) return { status: 404, message: '牌局不存在' };
  if (row.status !== 'playing') return { status: 400, message: '牌局已结束' };

  const playerCards = JSON.parse(row.player_cards);
  const aiCards = JSON.parse(row.ai_cards);
  let playerChips = row.player_chips;
  let aiChips = row.ai_chips;
  let pot = row.pot;
  let round = row.round;
  let status = 'playing';
  let winner = '';

  if (action === 'fold') {
    status = 'done';
    winner = 'ai';
    aiChips += pot;
    pot = 0;
  } else if (action === 'compare') {
    status = 'done';
    const cmp = compareHands(playerCards, aiCards);
    if (cmp > 0) { winner = 'player'; playerChips += pot; }
    else if (cmp < 0) { winner = 'ai'; aiChips += pot; }
    else { winner = 'draw'; playerChips += Math.floor(pot / 2); aiChips += pot - Math.floor(pot / 2); }
    pot = 0;
  } else if (action === 'bet') {
    const betAmount = Math.min(Number(body.amount || 20), playerChips);
    if (betAmount <= 0) return { status: 400, message: '筹码不足' };
    playerChips -= betAmount;
    pot += betAmount;
    round++;

    const aiAction = aiDecide(aiCards, round, aiChips, pot);
    if (aiAction === 'fold') {
      status = 'done';
      winner = 'player';
      playerChips += pot;
      pot = 0;
    } else {
      const aiBet = Math.min(betAmount, aiChips);
      aiChips -= aiBet;
      pot += aiBet;
    }
  } else {
    return { status: 400, message: '无效操作' };
  }

  db.prepare(`
    UPDATE apps_poker_games SET player_chips=?, ai_chips=?, pot=?, round=?, status=?, winner=? WHERE id=?
  `).run(playerChips, aiChips, pot, round, status, winner, id);

  return {
    success: true,
    game: {
      id,
      playerCards,
      aiCards: status === 'done' ? aiCards : [null, null, null],
      playerChips, aiChips, pot, round, status, winner
    }
  };
};

const aiDecide = (cards, round, chips, pot) => {
  const hr = handRank(cards);
  if (hr.type >= 4) return 'call';
  if (hr.type >= 2) return 'call';
  if (round > 5 && hr.type <= 1) return Math.random() < 0.4 ? 'fold' : 'call';
  return 'call';
};
