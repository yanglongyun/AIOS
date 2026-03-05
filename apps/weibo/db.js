import { createAppDb } from '../app_shared/db/createAppDb.js';

export const db = createAppDb('weibo.db');

export const initWeiboDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weibo_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
