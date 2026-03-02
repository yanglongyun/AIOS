import { getConfig, getState, calcEquity, getTodayChange, maskKey, parseNum } from '../../db.js';

export const getStatusHandler = () => {
  const cfg = getConfig();
  const state = getState();
  const lastPrice = parseNum(state.last_price);
  const equity = lastPrice > 0 ? calcEquity(cfg, lastPrice) : parseNum(cfg.virtual_usdt);
  const initialEq = parseNum(cfg.initial_equity, equity) || 1;
  const pnl = equity - initialEq;

  return {
    success: true,
    config: {
      base_url: cfg.base_url,
      api_key: maskKey(cfg.api_key),
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
