import { db } from "./client.js";
export const initDb = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS wt_nodes (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      title TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS wt_favorites (
      id TEXT PRIMARY KEY,
      node_id TEXT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
};
