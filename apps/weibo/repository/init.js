import { db } from './client.js';

export const initWeiboDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weibo_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS weibo_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      display_name TEXT NOT NULL DEFAULT 'twitter',
      signature TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.prepare(`
    INSERT OR IGNORE INTO weibo_profile (id, display_name, signature, avatar_url, updated_at)
    VALUES (1, 'twitter', '', '', datetime('now'))
  `).run();
};
