import crypto from 'crypto';
import { db } from '../app_shared/db/client.js';

const DEFAULT_STRATEGY_CODE = `const closes = ctx.candles.map(c => c.close).filter(n => Number.isFinite(n));
if (closes.length < 20) return { action: 'hold', reason: 'K线不足，暂不交易' };
const short = closes.slice(-5).reduce((s, n) => s + n, 0) / 5;
const mid = closes.slice(-20).reduce((s, n) => s + n, 0) / 20;
const diff = (short - mid) / mid;
if (diff > 0.006) return { action: 'buy', reason: '短均线上穿中均线，趋势偏强' };
if (diff < -0.006) return { action: 'sell', reason: '短均线下穿中均线，趋势偏弱' };
return { action: 'hold', reason: '信号不明确，继续观察' };`;

const DEFAULT_CONFIG = {
  id: 1,
  exchange: 'okx',
  base_url: 'https://www.okx.com',
  api_key: '',
  api_secret: '',
  passphrase: '',
  inst_id: 'BTC-USDT',
  bar: '1H',
  order_size_usdt: 50,
  interval_sec: 300,
  strategy_refresh_every: 12,
  live_mode: 0,
  strategy_code: DEFAULT_STRATEGY_CODE,
  virtual_usdt: 10000,
  virtual_coin: 0,
  initial_equity: 10000,
  updated_at: null
};

let timer = null;

const nowIso = () => new Date().toISOString();

const parseNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const jsonParse = (raw, fallback) => {
  try { return JSON.parse(raw); } catch { return fallback; }
};

const maskKey = (k = '') => {
  const text = String(k || '').trim();
  if (!text) return '';
  if (text.length <= 8) return '*'.repeat(text.length);
  return `${text.slice(0, 4)}****${text.slice(-4)}`;
};

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
  if (!resp.ok || data.code !== '0') {
    const msg = data?.msg || `${resp.status} ${resp.statusText}`;
    throw new Error(`OKX 请求失败: ${msg}`);
  }
  return data;
};

const logEvent = (level, message, meta = null) => {
  db.prepare(`
    INSERT INTO apps_cryptobot_logs (level, message, meta_json, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(level, message, JSON.stringify(meta || {}));
};

const getConfig = () => {
  const row = db.prepare('SELECT * FROM apps_cryptobot_config WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO apps_cryptobot_config (
        id, exchange, base_url, api_key, api_secret, passphrase,
        inst_id, bar, order_size_usdt, interval_sec, strategy_refresh_every,
        live_mode, strategy_code, virtual_usdt, virtual_coin, initial_equity, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      DEFAULT_CONFIG.exchange,
      DEFAULT_CONFIG.base_url,
      DEFAULT_CONFIG.api_key,
      DEFAULT_CONFIG.api_secret,
      DEFAULT_CONFIG.passphrase,
      DEFAULT_CONFIG.inst_id,
      DEFAULT_CONFIG.bar,
      DEFAULT_CONFIG.order_size_usdt,
      DEFAULT_CONFIG.interval_sec,
      DEFAULT_CONFIG.strategy_refresh_every,
      DEFAULT_CONFIG.live_mode,
      DEFAULT_CONFIG.strategy_code,
      DEFAULT_CONFIG.virtual_usdt,
      DEFAULT_CONFIG.virtual_coin,
      DEFAULT_CONFIG.initial_equity
    );
    return { ...DEFAULT_CONFIG };
  }
  return { ...DEFAULT_CONFIG, ...row };
};

const getState = () => {
  const row = db.prepare('SELECT * FROM apps_cryptobot_state WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO apps_cryptobot_state (
        id, running, tick_count, last_price, last_action, last_reason,
        latest_equity, latest_pnl, latest_pnl_ratio, last_run_at, updated_at
      ) VALUES (1, 0, 0, 0, 'hold', '', 0, 0, 0, '', datetime('now'))
    `).run();
    return {
      id: 1,
      running: 0,
      tick_count: 0,
      last_price: 0,
      last_action: 'hold',
      last_reason: '',
      latest_equity: 0,
      latest_pnl: 0,
      latest_pnl_ratio: 0,
      last_run_at: '',
      updated_at: nowIso()
    };
  }
  return row;
};

const saveState = (patch = {}) => {
  const state = { ...getState(), ...patch };
  db.prepare(`
    UPDATE apps_cryptobot_state
    SET running = ?, tick_count = ?, last_price = ?, last_action = ?, last_reason = ?,
        latest_equity = ?, latest_pnl = ?, latest_pnl_ratio = ?,
        last_run_at = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(
    state.running,
    state.tick_count,
    state.last_price,
    state.last_action,
    state.last_reason,
    state.latest_equity,
    state.latest_pnl,
    state.latest_pnl_ratio,
    state.last_run_at
  );
  return getState();
};

const fetchCandles = async (cfg) => {
  const url = `${cfg.base_url}/api/v5/market/candles?instId=${encodeURIComponent(cfg.inst_id)}&bar=${encodeURIComponent(cfg.bar)}&limit=100`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (!resp.ok || data.code !== '0') throw new Error(data?.msg || '读取行情失败');

  return (data.data || []).map((x) => ({
    ts: Number(x[0]),
    open: Number(x[1]),
    high: Number(x[2]),
    low: Number(x[3]),
    close: Number(x[4]),
    volume: Number(x[5])
  })).filter(c => Number.isFinite(c.close)).reverse();
};

const buildStrategyPrompt = (cfg, metrics) => {
  const tradeRows = db.prepare(`
    SELECT side, price, size_coin, amount_usdt, pnl, reason, mode, created_at
    FROM apps_cryptobot_trades
    ORDER BY id DESC
    LIMIT 20
  `).all();
  const tradesText = tradeRows.map((t, idx) => `${idx + 1}. ${t.created_at} | ${t.mode} | ${t.side} | price=${t.price} | coin=${t.size_coin} | usdt=${t.amount_usdt} | pnl=${t.pnl} | reason=${t.reason}`).join('\n') || '暂无交易';

  return `你是量化交易策略工程师。请针对 OKX 现货 ${cfg.inst_id} 生成“策略函数代码”。
目标：稳定风险下改进收益，不追求高频。

当前绩效：
- 最新权益: ${metrics.equity}
- 累计收益: ${metrics.pnl}
- 收益率: ${(metrics.pnlRatio * 100).toFixed(2)}%

最近交易：
${tradesText}

请输出 JSON：
{
  "summary":"策略说明，不超过120字",
  "strategyCode":"JavaScript 函数体字符串，直接可 new Function('ctx', strategyCode) 执行，并 return {action:'buy|sell|hold', reason:'...'}"
}
要求：
1) 仅输出 JSON
2) 必须使用 ctx.candles 计算信号
3) 不能抛异常
4) 默认偏保守，信号弱则 hold`;
};

const maybeRefreshStrategy = async (cfg, state, metrics) => {
  const every = Math.max(2, parseInt(cfg.strategy_refresh_every, 10) || 12);
  if (state.tick_count > 0 && state.tick_count % every !== 0) return;

  try {
    const resp = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: buildStrategyPrompt(cfg, metrics) }]
      })
    });
    const data = await resp.json();
    if (!resp.ok || data.success === false) throw new Error(data.message || `LLM ${resp.status}`);

    const parsed = jsonParse(data.message?.content || '{}', {});
    const strategyCode = String(parsed.strategyCode || '').trim();
    const summary = String(parsed.summary || '').trim();
    if (!strategyCode) throw new Error('AI 未返回策略代码');

    db.prepare(`
      UPDATE apps_cryptobot_config
      SET strategy_code = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(strategyCode);

    logEvent('info', '策略已更新', { summary });
  } catch (error) {
    logEvent('warn', `策略更新失败: ${error.message}`);
  }
};

const runStrategy = (code, ctx) => {
  try {
    const fn = new Function('ctx', `${code}`);
    const out = fn(ctx) || {};
    const action = String(out.action || 'hold').toLowerCase();
    const reason = String(out.reason || '').trim().slice(0, 200);
    if (!['buy', 'sell', 'hold'].includes(action)) return { action: 'hold', reason: '策略返回非法动作，已忽略' };
    return { action, reason: reason || '策略未给出原因' };
  } catch (error) {
    logEvent('error', `策略执行失败: ${error.message}`);
    return { action: 'hold', reason: '策略异常，停止交易' };
  }
};

const calcMetrics = (cfg, lastPrice) => {
  const equity = parseNum(cfg.virtual_usdt) + parseNum(cfg.virtual_coin) * parseNum(lastPrice);
  const pnl = equity - parseNum(cfg.initial_equity, equity);
  const base = parseNum(cfg.initial_equity, equity) || 1;
  return {
    equity,
    pnl,
    pnlRatio: pnl / base
  };
};

const persistEquity = (equity) => {
  db.prepare(`
    INSERT INTO apps_cryptobot_equity (equity, created_at)
    VALUES (?, datetime('now'))
  `).run(equity);
};

const recordTrade = ({ side, price, sizeCoin, amountUsdt, reason, mode, pnl = 0, raw = null }) => {
  db.prepare(`
    INSERT INTO apps_cryptobot_trades (
      side, price, size_coin, amount_usdt, pnl, reason, mode, raw_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(side, price, sizeCoin, amountUsdt, pnl, reason, mode, JSON.stringify(raw || {}));
};

const simulateTrade = (cfg, decision, lastPrice) => {
  const usdt = parseNum(cfg.virtual_usdt);
  const coin = parseNum(cfg.virtual_coin);
  const amountUsdt = Math.max(5, parseNum(cfg.order_size_usdt, 50));

  if (decision.action === 'buy') {
    const spend = Math.min(usdt, amountUsdt);
    if (spend < 5) return { executed: false, reason: 'USDT 余额不足' };
    const sizeCoin = spend / lastPrice;

    db.prepare(`
      UPDATE apps_cryptobot_config
      SET virtual_usdt = ?, virtual_coin = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(usdt - spend, coin + sizeCoin);

    recordTrade({ side: 'buy', price: lastPrice, sizeCoin, amountUsdt: spend, reason: decision.reason, mode: 'paper' });
    return { executed: true, side: 'buy', sizeCoin, amountUsdt: spend };
  }

  if (decision.action === 'sell') {
    const maxSellCoin = Math.min(coin, amountUsdt / lastPrice);
    if (maxSellCoin <= 0) return { executed: false, reason: '币余额不足' };
    const amount = maxSellCoin * lastPrice;

    db.prepare(`
      UPDATE apps_cryptobot_config
      SET virtual_usdt = ?, virtual_coin = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(usdt + amount, coin - maxSellCoin);

    recordTrade({ side: 'sell', price: lastPrice, sizeCoin: maxSellCoin, amountUsdt: amount, reason: decision.reason, mode: 'paper' });
    return { executed: true, side: 'sell', sizeCoin: maxSellCoin, amountUsdt: amount };
  }

  return { executed: false, reason: decision.reason || 'hold' };
};

const liveTrade = async (cfg, decision, lastPrice) => {
  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('实盘模式缺少 API 配置');
  }

  if (decision.action === 'hold') return { executed: false, reason: decision.reason || 'hold' };

  const amountUsdt = Math.max(5, parseNum(cfg.order_size_usdt, 50));
  let payload;
  if (decision.action === 'buy') {
    payload = {
      instId: cfg.inst_id,
      tdMode: 'cash',
      side: 'buy',
      ordType: 'market',
      tgtCcy: 'quote_ccy',
      sz: String(amountUsdt)
    };
  } else {
    const sellCoin = amountUsdt / lastPrice;
    payload = {
      instId: cfg.inst_id,
      tdMode: 'cash',
      side: 'sell',
      ordType: 'market',
      sz: String(sellCoin)
    };
  }

  const res = await okxRequest(cfg, 'POST', '/api/v5/trade/order', payload);
  const raw = res.data?.[0] || {};
  const stateText = String(raw.sCode || '0');
  if (stateText !== '0') {
    throw new Error(raw.sMsg || '下单失败');
  }

  const sizeCoin = decision.action === 'buy' ? amountUsdt / lastPrice : amountUsdt / lastPrice;
  recordTrade({ side: decision.action, price: lastPrice, sizeCoin, amountUsdt, reason: decision.reason, mode: 'live', raw });
  return { executed: true, side: decision.action, sizeCoin, amountUsdt };
};

export const runBotOnce = async () => {
  const cfg = getConfig();
  const state = getState();

  const candles = await fetchCandles(cfg);
  const last = candles[candles.length - 1];
  if (!last || !Number.isFinite(last.close)) throw new Error('无法获取价格');

  const previewMetrics = calcMetrics(cfg, last.close);
  await maybeRefreshStrategy(cfg, state, previewMetrics);
  const cfg2 = getConfig();

  const decision = runStrategy(cfg2.strategy_code || DEFAULT_STRATEGY_CODE, {
    candles,
    price: last.close,
    virtual: {
      usdt: parseNum(cfg2.virtual_usdt),
      coin: parseNum(cfg2.virtual_coin)
    }
  });

  let tradeResult;
  if (cfg2.live_mode) {
    tradeResult = await liveTrade(cfg2, decision, last.close);
  } else {
    tradeResult = simulateTrade(cfg2, decision, last.close);
  }

  const cfgAfter = getConfig();
  const metrics = calcMetrics(cfgAfter, last.close);
  persistEquity(metrics.equity);

  const nextState = saveState({
    running: state.running,
    tick_count: parseInt(state.tick_count || 0, 10) + 1,
    last_price: last.close,
    last_action: decision.action,
    last_reason: decision.reason,
    latest_equity: metrics.equity,
    latest_pnl: metrics.pnl,
    latest_pnl_ratio: metrics.pnlRatio,
    last_run_at: nowIso()
  });

  logEvent('info', '执行完成', {
    action: decision.action,
    reason: decision.reason,
    executed: tradeResult.executed,
    mode: cfgAfter.live_mode ? 'live' : 'paper',
    price: last.close,
    equity: metrics.equity,
    pnl: metrics.pnl
  });

  return { decision, tradeResult, metrics, state: nextState };
};

const clearTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

export const startBot = () => {
  const cfg = getConfig();
  const intervalMs = Math.max(15, parseInt(cfg.interval_sec || 300, 10)) * 1000;

  clearTimer();
  saveState({ ...getState(), running: 1 });

  timer = setInterval(async () => {
    try {
      await runBotOnce();
    } catch (error) {
      logEvent('error', `执行失败: ${error.message}`);
    }
  }, intervalMs);

  runBotOnce().catch((error) => logEvent('error', `首次执行失败: ${error.message}`));
  logEvent('info', `机器人启动，间隔 ${Math.round(intervalMs / 1000)} 秒`);

  return getState();
};

export const stopBot = () => {
  clearTimer();
  const state = saveState({ ...getState(), running: 0 });
  logEvent('info', '机器人已停止');
  return state;
};

export const getBotStatus = () => {
  const cfg = getConfig();
  const state = getState();
  const safeCfg = {
    ...cfg,
    api_key: maskKey(cfg.api_key),
    api_secret: cfg.api_secret ? '********' : '',
    passphrase: cfg.passphrase ? '********' : ''
  };
  return {
    config: safeCfg,
    state,
    running: Boolean(state.running),
    timerActive: Boolean(timer)
  };
};

export const saveConfig = (body = {}) => {
  const cfg = getConfig();
  const next = {
    ...cfg,
    base_url: String(body.base_url || cfg.base_url).trim() || cfg.base_url,
    api_key: String(body.api_key ?? cfg.api_key).trim(),
    api_secret: String(body.api_secret ?? cfg.api_secret).trim(),
    passphrase: String(body.passphrase ?? cfg.passphrase).trim(),
    inst_id: String(body.inst_id || cfg.inst_id).trim() || cfg.inst_id,
    bar: String(body.bar || cfg.bar).trim() || cfg.bar,
    order_size_usdt: Math.max(5, parseNum(body.order_size_usdt, cfg.order_size_usdt)),
    interval_sec: Math.max(15, parseInt(body.interval_sec ?? cfg.interval_sec, 10) || cfg.interval_sec),
    strategy_refresh_every: Math.max(2, parseInt(body.strategy_refresh_every ?? cfg.strategy_refresh_every, 10) || cfg.strategy_refresh_every),
    live_mode: body.live_mode ? 1 : 0,
    strategy_code: String(body.strategy_code || cfg.strategy_code || DEFAULT_STRATEGY_CODE),
    virtual_usdt: Math.max(0, parseNum(body.virtual_usdt, cfg.virtual_usdt)),
    virtual_coin: Math.max(0, parseNum(body.virtual_coin, cfg.virtual_coin)),
    initial_equity: Math.max(1, parseNum(body.initial_equity, cfg.initial_equity))
  };

  db.prepare(`
    UPDATE apps_cryptobot_config
    SET base_url = ?, api_key = ?, api_secret = ?, passphrase = ?,
        inst_id = ?, bar = ?, order_size_usdt = ?, interval_sec = ?,
        strategy_refresh_every = ?, live_mode = ?, strategy_code = ?,
        virtual_usdt = ?, virtual_coin = ?, initial_equity = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(
    next.base_url,
    next.api_key,
    next.api_secret,
    next.passphrase,
    next.inst_id,
    next.bar,
    next.order_size_usdt,
    next.interval_sec,
    next.strategy_refresh_every,
    next.live_mode,
    next.strategy_code,
    next.virtual_usdt,
    next.virtual_coin,
    next.initial_equity
  );

  logEvent('info', '配置已更新', {
    instId: next.inst_id,
    bar: next.bar,
    orderSizeUsdt: next.order_size_usdt,
    intervalSec: next.interval_sec,
    strategyRefreshEvery: next.strategy_refresh_every,
    liveMode: next.live_mode
  });

  return getBotStatus();
};

export const forceRefreshStrategy = async () => {
  const cfg = getConfig();
  const state = getState();
  const lastPrice = parseNum(state.last_price, 0);
  const metrics = calcMetrics(cfg, lastPrice || 1);
  await maybeRefreshStrategy(cfg, { ...state, tick_count: 0 }, metrics);
  return getBotStatus();
};

export const listTrades = ({ page = 1, pageSize = 20 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (p - 1) * size;
  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_cryptobot_trades').get().c || 0;

  const items = db.prepare(`
    SELECT id, side, price, size_coin, amount_usdt, pnl, reason, mode, created_at
    FROM apps_cryptobot_trades
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(size, offset);

  return {
    success: true,
    items,
    page: p,
    pageSize: size,
    total,
    totalPages: Math.max(1, Math.ceil(total / size))
  };
};

export const listEquity = ({ limit = 300 } = {}) => {
  const size = Math.min(1000, Math.max(10, parseInt(limit, 10) || 300));
  const rows = db.prepare(`
    SELECT id, equity, created_at
    FROM apps_cryptobot_equity
    ORDER BY id DESC
    LIMIT ?
  `).all(size).reverse();

  return {
    success: true,
    points: rows.map((r) => ({
      id: r.id,
      equity: parseNum(r.equity),
      createdAt: r.created_at
    }))
  };
};

export const listLogs = ({ limit = 100 } = {}) => {
  const size = Math.min(500, Math.max(10, parseInt(limit, 10) || 100));
  const rows = db.prepare(`
    SELECT id, level, message, meta_json, created_at
    FROM apps_cryptobot_logs
    ORDER BY id DESC
    LIMIT ?
  `).all(size);

  return {
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      level: r.level,
      message: r.message,
      meta: jsonParse(r.meta_json || '{}', {}),
      createdAt: r.created_at
    }))
  };
};

export const initCryptobotRuntime = () => {
  const state = getState();
  if (state.running) startBot();
};

export const initCryptobotDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_cryptobot_config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      exchange TEXT NOT NULL DEFAULT 'okx',
      base_url TEXT NOT NULL DEFAULT 'https://www.okx.com',
      api_key TEXT NOT NULL DEFAULT '',
      api_secret TEXT NOT NULL DEFAULT '',
      passphrase TEXT NOT NULL DEFAULT '',
      inst_id TEXT NOT NULL DEFAULT 'BTC-USDT',
      bar TEXT NOT NULL DEFAULT '1H',
      order_size_usdt REAL NOT NULL DEFAULT 50,
      interval_sec INTEGER NOT NULL DEFAULT 300,
      strategy_refresh_every INTEGER NOT NULL DEFAULT 12,
      live_mode INTEGER NOT NULL DEFAULT 0,
      strategy_code TEXT NOT NULL,
      virtual_usdt REAL NOT NULL DEFAULT 10000,
      virtual_coin REAL NOT NULL DEFAULT 0,
      initial_equity REAL NOT NULL DEFAULT 10000,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_cryptobot_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      running INTEGER NOT NULL DEFAULT 0,
      tick_count INTEGER NOT NULL DEFAULT 0,
      last_price REAL NOT NULL DEFAULT 0,
      last_action TEXT NOT NULL DEFAULT 'hold',
      last_reason TEXT NOT NULL DEFAULT '',
      latest_equity REAL NOT NULL DEFAULT 0,
      latest_pnl REAL NOT NULL DEFAULT 0,
      latest_pnl_ratio REAL NOT NULL DEFAULT 0,
      last_run_at TEXT DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_cryptobot_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      side TEXT NOT NULL,
      price REAL NOT NULL,
      size_coin REAL NOT NULL,
      amount_usdt REAL NOT NULL,
      pnl REAL NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'paper',
      raw_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_cryptobot_equity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equity REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_cryptobot_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  getConfig();
  getState();
};
