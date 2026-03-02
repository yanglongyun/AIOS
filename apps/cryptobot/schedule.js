import crypto from 'crypto';
import { db, getConfig, getState, saveState, recordDecision, calcEquity, persistEquity, parseNum, nowIso } from './db.js';

let timer = null;

const jsonParse = (raw, fallback) => { try { return JSON.parse(raw); } catch { return fallback; } };

// ---- OKX ----

const signOkx = ({ ts, method, path, body, secret }) => {
  const prehash = `${ts}${method.toUpperCase()}${path}${body || ''}`;
  return crypto.createHmac('sha256', secret).update(prehash).digest('base64');
};

const okxRequest = async (cfg, method, path, payload = null) => {
  const ts = nowIso();
  const body = payload ? JSON.stringify(payload) : '';
  const sign = signOkx({ ts, method, path, body, secret: cfg.api_secret });
  const resp = await fetch(`${cfg.base_url}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'OK-ACCESS-KEY': cfg.api_key,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': cfg.passphrase
    },
    body: body || undefined
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.code !== '0') throw new Error(`OKX: ${data?.msg || resp.status}`);
  return data;
};

const fetchCandles = async (cfg) => {
  const url = `${cfg.base_url}/api/v5/market/candles?instId=${encodeURIComponent(cfg.inst_id)}&bar=1H&limit=50`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!resp.ok || data.code !== '0') throw new Error(data?.msg || '行情获取失败');
  return (data.data || []).map(x => ({
    ts: Number(x[0]),
    open: Number(x[1]),
    high: Number(x[2]),
    low: Number(x[3]),
    close: Number(x[4]),
    volume: Number(x[5])
  })).filter(c => Number.isFinite(c.close)).reverse();
};

// ---- AI ----

const formatCandles = (candles) => {
  return candles.slice(-20).map(c => {
    const d = new Date(c.ts);
    const t = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${t} | O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${Math.round(c.volume)}`;
  }).join('\n');
};

const buildPrompt = (cfg, candles, equity, pnl, recentDecisions) => {
  const lastPrice = candles[candles.length - 1].close;
  const coinValue = parseNum(cfg.virtual_coin) * lastPrice;

  const decisionsText = recentDecisions.length
    ? recentDecisions.map(d => {
        const t = d.created_at?.slice(11, 16) || '??:??';
        const trade = d.action !== 'hold' && d.amount_usdt > 0 ? ` | ${d.action} ${d.amount_usdt.toFixed(1)}U @ ${d.price}` : '';
        return `${t} ${d.action.toUpperCase()}${trade} | ${d.reason}`;
      }).join('\n')
    : '暂无';

  return `你是加密货币交易 AI。根据用户指令和市场数据做出决策。

## 用户交易指令
${cfg.directive || '默认保守策略，盯 BTC-USDT'}

## 当前账户
可用 USDT: ${parseNum(cfg.virtual_usdt).toFixed(2)}
持有 ${cfg.inst_id}: ${parseNum(cfg.virtual_coin).toFixed(6)}（≈ ${coinValue.toFixed(2)} U）
总权益: ${equity.toFixed(2)} U（初始 ${parseNum(cfg.initial_equity)} U，累计 ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} U）

## K 线（${cfg.inst_id}，1H，最近 20 根）
${formatCandles(candles)}

## 最近决策
${decisionsText}

返回 JSON：{"action":"buy或sell或hold","reason":"中文一句话30字内","amount_usdt":数字}

规则：
1. 严格遵守用户指令的风控要求（止盈止损、仓位限制等）
2. 没有明确信号必须 hold
3. amount_usdt 是本次操作金额，hold 时填 0
4. 只返回 JSON`;
};

const askAI = async (prompt) => {
  const resp = await fetch('http://localhost:9700/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `LLM ${resp.status}`);

  const parsed = jsonParse(data.message?.content || '{}', {});
  const action = String(parsed.action || 'hold').toLowerCase();
  if (!['buy', 'sell', 'hold'].includes(action)) return { action: 'hold', reason: 'AI 返回非法动作', amount_usdt: 0 };

  return {
    action,
    reason: String(parsed.reason || '').slice(0, 100),
    amount_usdt: Math.max(0, parseNum(parsed.amount_usdt, 0))
  };
};

// ---- Trading ----

const simulateTrade = (cfg, decision, lastPrice) => {
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

// ---- Core execution ----

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

// ---- Timer control ----

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
