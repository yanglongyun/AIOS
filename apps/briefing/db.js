import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'briefing.db'));
db.pragma('journal_mode = WAL');

export const initBriefingDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_briefing_config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      requirement TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_briefing_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      requirement TEXT NOT NULL DEFAULT '',
      content_markdown TEXT NOT NULL,
      sources_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};
