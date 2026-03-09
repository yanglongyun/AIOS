import { parseNum, nowIso } from '../repository/client.js';
import { getConfig, saveConfig } from '../repository/config.js';
import { getState, saveState } from '../repository/state.js';
import { recordDecision, recentDecisions } from '../repository/decisions.js';
import { persistEquity } from '../repository/equity.js';
import { fetchCandles, fetchSpotBalances } from './okx.js';
import { buildPrompt } from './prompt.js';
import { executeRealTrade } from './trade.js';
import { parseJson } from '../../../shared/json/parse.js';

let timer = null;

const askAI = async (prompt) => {
  const resp = await fetch('http://localhost:9700/api/task/create/instant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app: 'cryptobot',
      title: '炒币策略决策',
      prompt,
      schema: { required: ['action', 'reason', 'amount_usdt'] }
    })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `request failed ${resp.status}`);
  const parsed = parseJson(data.response || '{}', {});
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
  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) throw new Error('请先配置 OKX API Key/Secret/Passphrase');

  const candles = await fetchCandles(cfg);
  const last = candles[candles.length - 1];
  if (!last?.close) throw new Error('无法获取价格');
  const lastPrice = last.close;

  const balancesBefore = await fetchSpotBalances(cfg, cfg.inst_id);
  const usdtBefore = parseNum(balancesBefore.quoteCash);
  const coinBefore = parseNum(balancesBefore.baseCash);
  const equity = usdtBefore + coinBefore * lastPrice;
  const initEq = parseNum(cfg.initial_equity, equity);
  const pnl = equity - initEq;

  saveConfig({ virtual_usdt: usdtBefore, virtual_coin: coinBefore });

  const recent = recentDecisions(10);
  const prompt = buildPrompt({ ...cfg, virtual_usdt: usdtBefore, virtual_coin: coinBefore }, candles, equity, pnl, recent);
  const decision = await askAI(prompt);

  let trade = { executed: false, sizeCoin: 0, amountUsdt: 0 };
  if (decision.action !== 'hold' && decision.amount_usdt > 0) {
    trade = await executeRealTrade({ cfg, decision, lastPrice, balances: balancesBefore });
  }

  const balancesAfter = await fetchSpotBalances(cfg, cfg.inst_id);
  const usdtAfter = parseNum(balancesAfter.quoteCash);
  const coinAfter = parseNum(balancesAfter.baseCash);
  const equityAfter = usdtAfter + coinAfter * lastPrice;

  saveConfig({ virtual_usdt: usdtAfter, virtual_coin: coinAfter });

  persistEquity(equityAfter);

  const reasonSuffix = (decision.action !== 'hold' && !trade.executed) ? `（${trade.reason || '未成交'}）` : '';
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
  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('请先配置 OKX API Key/Secret/Passphrase');
  }
  if (!cfg.directive) {
    throw new Error('请先设置交易指令');
  }
  const sec = Math.max(60, parseInt(intervalSec || cfg.interval_sec || 300));

  if (timer) clearInterval(timer);

  saveConfig({ interval_sec: sec });
  const oldState = getState();
  saveState({ ...oldState, running: 1, started_at: nowIso(), tick_count: oldState.tick_count || 0, trade_count: oldState.trade_count || 0 });

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
    if (cfg.api_key && cfg.api_secret && cfg.passphrase && cfg.directive) {
      startBot(cfg.interval_sec);
    } else {
      saveState({ ...state, running: 0 });
    }
  }
};
