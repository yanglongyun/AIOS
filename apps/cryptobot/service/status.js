import { getConfig } from '../repository/config.js';
import { getState } from '../repository/state.js';
import { getTodayChange } from '../repository/equity.js';
import { parseNum } from '../repository/client.js';
import { fetchCandles, fetchSpotBalances } from '../runtime/okx.js';

export const getStatus = async () => {
  const cfg = getConfig();
  const state = getState();
  let lastPrice = parseNum(state.last_price);
  let usdt = parseNum(cfg.virtual_usdt);
  let coin = parseNum(cfg.virtual_coin);

  if (cfg.api_key && cfg.api_secret && cfg.passphrase) {
    try {
      const [candles, balances] = await Promise.all([
        fetchCandles(cfg),
        fetchSpotBalances(cfg, cfg.inst_id)
      ]);
      const last = candles[candles.length - 1];
      if (last?.close) lastPrice = parseNum(last.close);
      usdt = parseNum(balances.quoteCash);
      coin = parseNum(balances.baseCash);
    } catch {
      // keep cached values when OKX temporarily unavailable
    }
  }

  const equity = lastPrice > 0 ? (usdt + coin * lastPrice) : parseNum(usdt);
  const initialEq = parseNum(cfg.initial_equity, equity) || 1;
  const pnl = equity - initialEq;

  return {
    success: true,
    config: {
      base_url: cfg.base_url,
      api_key: cfg.api_key || '',
      api_secret: cfg.api_secret || '',
      passphrase: cfg.passphrase || '',
      has_api_key: Boolean(cfg.api_key),
      has_api_secret: Boolean(cfg.api_secret),
      has_passphrase: Boolean(cfg.passphrase),
      has_keys: Boolean(cfg.api_key && cfg.api_secret && cfg.passphrase),
      directive: cfg.directive,
      interval_sec: cfg.interval_sec,
      inst_id: cfg.inst_id,
      updated_at: cfg.updated_at
    },
    state: {
      running: Boolean(state.running),
      tick_count: state.tick_count || 0,
      trade_count: state.trade_count || 0,
      started_at: state.started_at,
      last_run_at: state.last_run_at,
      last_price: lastPrice
    },
    equity: {
      current: equity,
      initial: parseNum(cfg.initial_equity),
      pnl,
      pnl_ratio: pnl / initialEq,
      today_change: getTodayChange(equity)
    }
  };
};
