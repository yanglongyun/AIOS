import { db, getConfig, getState, saveState, recordDecision, calcEquity, persistEquity, parseNum, nowIso } from '../db.js';
import { fetchCandles } from './okx.js';
import { buildPrompt } from './prompt.js';
import { simulateTrade } from './trade.js';

let timer = null;

const jsonParse = (raw, fallback) => { try { return JSON.parse(raw); } catch { return fallback; } };

const askAI = async (prompt) => {
  const resp = await fetch('http://localhost:9700/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app: 'cryptobot', prompt })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `request failed ${resp.status}`);
  const parsed = jsonParse(data.response || '{}', {});
  const action = String(parsed.action || 'hold').toLowerCase();
  if (!['buy', 'sell', 'hold'].includes(action)) return { action: 'hold', reason: 'AI 返回非法动作', amount_usdt: 0 };

  return {
    action,
    reason: String(parsed.reason || '').slice(0, 100),
    amount_usdt: Math.max(0, parseNum(parsed.amount_usdt, 0))
  };
};

const runBotOnce = async () => {
  const cfg = getConfig();
  if (!cfg.directive) throw new Error('请先设置交易指令');

  const candles = await fetchCandles(cfg);
  const last = candles[candles.length - 1];
  if (!last?.close) throw new Error('无法获取价格');
  const lastPrice = last.close;

  const equity = calcEquity(cfg, lastPrice);
  const pnl = equity - parseNum(cfg.initial_equity, equity);

  const recentDecisions = db.prepare('SELECT * FROM apps_cryptobot_decisions ORDER BY id DESC LIMIT 10').all().reverse();
  const prompt = buildPrompt(cfg, candles, equity, pnl, recentDecisions);
  const decision = await askAI(prompt);

  let trade = { executed: false, sizeCoin: 0, amountUsdt: 0 };
  if (decision.action !== 'hold' && decision.amount_usdt > 0) {
    trade = simulateTrade(cfg, decision, lastPrice);
  }

  const cfgAfter = getConfig();
  const equityAfter = calcEquity(cfgAfter, lastPrice);
  persistEquity(equityAfter);

  const reasonSuffix = (decision.action !== 'hold' && !trade.executed) ? '（余额不足）' : '';
  recordDecision({
    action: decision.action,
    reason: decision.reason + reasonSuffix,
    price: lastPrice,
    sizeCoin: trade.sizeCoin || 0,
    amountUsdt: trade.amountUsdt || 0,
    equityAfter
  });

  const state = getState();
  saveState({
    running: state.running,
    tick_count: parseInt(state.tick_count || 0) + 1,
    trade_count: parseInt(state.trade_count || 0) + (trade.executed ? 1 : 0),
    last_price: lastPrice,
    started_at: state.started_at,
    last_run_at: nowIso()
  });
};

export const startBot = (intervalSec) => {
  const cfg = getConfig();
  const sec = Math.max(60, parseInt(intervalSec || cfg.interval_sec || 300));

  if (timer) clearInterval(timer);

  db.prepare("UPDATE apps_cryptobot_config SET interval_sec = ?, updated_at = datetime('now') WHERE id = 1").run(sec);
  saveState({ ...getState(), running: 1, started_at: nowIso(), tick_count: 0, trade_count: 0 });

  timer = setInterval(async () => {
    try { await runBotOnce(); } catch (e) { console.error('[cryptobot]', e.message); }
  }, sec * 1000);

  runBotOnce().catch(e => console.error('[cryptobot] first run:', e.message));
  return getState();
};

export const stopBot = () => {
  if (timer) { clearInterval(timer); timer = null; }
  return saveState({ ...getState(), running: 0 });
};

export const initRuntime = () => {
  const state = getState();
  if (state.running) {
    const cfg = getConfig();
    startBot(cfg.interval_sec);
  }
};
