import { getConfig, saveConfig } from '../repository/config.js';
import { parseNum } from '../repository/client.js';
import { fetchCandles, fetchSpotBalances } from '../runtime/okx.js';
import { startBot } from '../runtime/index.js';

export const start = async (body = {}) => {
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

  saveConfig({ virtual_usdt: usdt, virtual_coin: coin, initial_equity: equity });

  startBot(body.interval_sec);
  return { success: true };
};
