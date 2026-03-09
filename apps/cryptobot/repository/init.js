import { db } from './client.js';
import { getConfig } from './config.js';
import { getState } from './state.js';

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
