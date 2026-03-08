import { db, getConfig, parseNum } from '../db.js';
import { fetchCandles, fetchSpotBalances } from '../runtime/okx.js';
import { startBot } from '../runtime/index.js';

export const startHandler = async (body = {}) => {
  const cfg = getConfig();
  const [candles, balances] = await Promise.all([
    fetchCandles(cfg),
    fetchSpotBalances(cfg, cfg.inst_id)
  ]);
  const last = candles[candles.length - 1];
  const lastPrice = parseNum(last?.close);
  const usdt = parseNum(balances.quoteCash);
  const coin = parseNum(balances.baseCash);
  const equity = lastPrice > 0 ? usdt + coin * lastPrice : usdt;

  db.prepare(`
    UPDATE apps_cryptobot_config
    SET virtual_usdt = ?, virtual_coin = ?, initial_equity = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(usdt, coin, equity);

  startBot(body.interval_sec);
  return { success: true };
};
