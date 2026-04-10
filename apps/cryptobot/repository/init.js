import { db } from "./client.js";
import { getConfig } from "./config.js";
import { getState } from "./state.js";
const initDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS cryptobot_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    base_url TEXT NOT NULL DEFAULT 'https://www.okx.com',
    api_key TEXT NOT NULL DEFAULT '',
    api_secret TEXT NOT NULL DEFAULT '',
    passphrase TEXT NOT NULL DEFAULT '',
    goal TEXT NOT NULL DEFAULT '',
    locale TEXT NOT NULL DEFAULT 'en',
    task_title_template TEXT NOT NULL DEFAULT '',
    task_prompt_template TEXT NOT NULL DEFAULT '',
    interval_sec INTEGER NOT NULL DEFAULT 300,
    initial_equity REAL NOT NULL DEFAULT 0,
    current_equity REAL NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  const configCols = db.prepare("PRAGMA table_info(cryptobot_config)").all();
  if (!configCols.some((col) => col.name === "locale")) {
    db.exec(`ALTER TABLE cryptobot_config ADD COLUMN locale TEXT NOT NULL DEFAULT 'en'`);
  }
  if (!configCols.some((col) => col.name === "task_title_template")) {
    db.exec(`ALTER TABLE cryptobot_config ADD COLUMN task_title_template TEXT NOT NULL DEFAULT ''`);
  }
  if (!configCols.some((col) => col.name === "task_prompt_template")) {
    db.exec(`ALTER TABLE cryptobot_config ADD COLUMN task_prompt_template TEXT NOT NULL DEFAULT ''`);
  }
  db.exec(`CREATE TABLE IF NOT EXISTS cryptobot_state (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    running INTEGER NOT NULL DEFAULT 0,
    tick_count INTEGER NOT NULL DEFAULT 0,
    started_at TEXT DEFAULT '',
    last_run_at TEXT DEFAULT '',
    last_error TEXT DEFAULT '',
    last_error_at TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS cryptobot_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT NOT NULL DEFAULT '',
    task_id INTEGER NOT NULL DEFAULT 0,
    ok INTEGER NOT NULL DEFAULT 1,
    error TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS cryptobot_equity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equity REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  getConfig();
  getState();
};
export {
  initDatabase
};
