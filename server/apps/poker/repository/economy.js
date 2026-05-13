import { db } from "./client.js";
const setPokerBalances = ({ playerBalance, aiBalance }) => {
  db.exec("BEGIN");
  try {
    db.prepare(`UPDATE poker_accounts SET balance = ? WHERE role = 'player'`).run(Math.max(0, Number(playerBalance || 0)));
    db.prepare(`UPDATE poker_accounts SET balance = ? WHERE role = 'ai'`).run(Math.max(0, Number(aiBalance || 0)));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
const getPokerEconomy = () => {
  const player = db.prepare(`SELECT balance FROM poker_accounts WHERE role = 'player'`).get() || { balance: 0 };
  const ai = db.prepare(`SELECT balance FROM poker_accounts WHERE role = 'ai'`).get() || { balance: 0 };
  return {
    playerBalance: Number(player.balance || 0),
    aiBalance: Number(ai.balance || 0)
  };
};
export {
  getPokerEconomy,
  setPokerBalances
};
