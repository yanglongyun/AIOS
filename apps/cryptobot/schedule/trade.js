import { db, parseNum } from '../db.js';

export const simulateTrade = (cfg, decision, lastPrice) => {
  const usdt = parseNum(cfg.virtual_usdt);
  const coin = parseNum(cfg.virtual_coin);
  const amt = decision.amount_usdt;

  if (decision.action === 'buy') {
    const spend = Math.min(usdt, amt);
    if (spend < 1) return { executed: false, sizeCoin: 0, amountUsdt: 0 };
    const sizeCoin = spend / lastPrice;
    db.prepare("UPDATE apps_cryptobot_config SET virtual_usdt = ?, virtual_coin = ?, updated_at = datetime('now') WHERE id = 1")
      .run(usdt - spend, coin + sizeCoin);
    return { executed: true, sizeCoin, amountUsdt: spend };
  }

  if (decision.action === 'sell') {
    const maxSell = Math.min(coin, amt / lastPrice);
    if (maxSell <= 0) return { executed: false, sizeCoin: 0, amountUsdt: 0 };
    const amount = maxSell * lastPrice;
    db.prepare("UPDATE apps_cryptobot_config SET virtual_usdt = ?, virtual_coin = ?, updated_at = datetime('now') WHERE id = 1")
      .run(usdt + amount, coin - maxSell);
    return { executed: true, sizeCoin: maxSell, amountUsdt: amount };
  }

  return { executed: false, sizeCoin: 0, amountUsdt: 0 };
};
