import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'cryptobot.db'));
db.pragma('journal_mode = WAL');

export const parseNum = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
export const nowIso = () => new Date().toISOString();
export const maskKey = (k = '') => {
  const text = String(k || '').trim();
  if (!text) return '';
  if (text.length <= 8) return '*'.repeat(text.length);
  return `${text.slice(0, 4)}****${text.slice(-4)}`;
};

export const getConfig = () => {
  const row = db.prepare('SELECT * FROM apps_cryptobot_config WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO apps_cryptobot_config (id, base_url, directive, interval_sec, inst_id, virtual_usdt, virtual_coin, initial_equity, updated_at)
      VALUES (1, 'https://www.okx.com', '', 300, 'BTC-USDT', 10000, 0, 10000, datetime('now'))
    `).run();
    return { id: 1, base_url: 'https://www.okx.com', api_key: '', api_secret: '', passphrase: '', directive: '', interval_sec: 300, inst_id: 'BTC-USDT', virtual_usdt: 10000, virtual_coin: 0, initial_equity: 10000 };
  }
  return row;
};

export const getState = () => {
  const row = db.prepare('SELECT * FROM apps_cryptobot_state WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO apps_cryptobot_state (id, running, tick_count, trade_count, last_price, started_at, last_run_at, updated_at)
      VALUES (1, 0, 0, 0, 0, '', '', datetime('now'))
    `).run();
    return { id: 1, running: 0, tick_count: 0, trade_count: 0, last_price: 0, started_at: '', last_run_at: '' };
  }
  return row;
};

export const saveState = (patch = {}) => {
  const state = { ...getState(), ...patch };
  db.prepare(`
    UPDATE apps_cryptobot_state
    SET running = ?, tick_count = ?, trade_count = ?, last_price = ?,
        started_at = ?, last_run_at = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(state.running, state.tick_count, state.trade_count, state.last_price, state.started_at, state.last_run_at);
  return getState();
};

export const recordDecision = ({ action, reason, price, sizeCoin, amountUsdt, equityAfter }) => {
  db.prepare(`
    INSERT INTO apps_cryptobot_decisions (action, reason, price, size_coin, amount_usdt, equity_after, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(action, reason, price, sizeCoin, amountUsdt, equityAfter);
};

export const calcEquity = (cfg, lastPrice) => {
  return parseNum(cfg.virtual_usdt) + parseNum(cfg.virtual_coin) * parseNum(lastPrice);
};

export const persistEquity = (equity) => {
  db.prepare("INSERT INTO apps_cryptobot_equity (equity, created_at) VALUES (?, datetime('now'))").run(equity);
};

export const getTodayChange = (currentEquity) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const first = db.prepare("SELECT equity FROM apps_cryptobot_equity WHERE date(created_at) = ? ORDER BY id ASC LIMIT 1").get(todayStr);
  if (!first) return 0;
  return currentEquity - first.equity;
};

export const initDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS apps_cryptobot_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    base_url TEXT NOT NULL DEFAULT 'https://www.okx.com',
    api_key TEXT NOT NULL DEFAULT '',
    api_secret TEXT NOT NULL DEFAULT '',
    passphrase TEXT NOT NULL DEFAULT '',
    directive TEXT NOT NULL DEFAULT '',
    interval_sec INTEGER NOT NULL DEFAULT 300,
    inst_id TEXT NOT NULL DEFAULT 'BTC-USDT',
    virtual_usdt REAL NOT NULL DEFAULT 10000,
    virtual_coin REAL NOT NULL DEFAULT 0,
    initial_equity REAL NOT NULL DEFAULT 10000,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS apps_cryptobot_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    running INTEGER NOT NULL DEFAULT 0,
    tick_count INTEGER NOT NULL DEFAULT 0,
    trade_count INTEGER NOT NULL DEFAULT 0,
    last_price REAL NOT NULL DEFAULT 0,
    started_at TEXT DEFAULT '',
    last_run_at TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS apps_cryptobot_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    size_coin REAL NOT NULL DEFAULT 0,
    amount_usdt REAL NOT NULL DEFAULT 0,
    equity_after REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS apps_cryptobot_equity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equity REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  getConfig();
  getState();
};
