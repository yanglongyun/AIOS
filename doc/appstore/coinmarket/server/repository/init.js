import { db } from "./client.js";
const initCoinmarketDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS coin_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coin_id TEXT NOT NULL,
      coin_name TEXT NOT NULL,
      coin_symbol TEXT NOT NULL DEFAULT '',
      coin_image TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      analysis TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
export { initCoinmarketDatabase };
