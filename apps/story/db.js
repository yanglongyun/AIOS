import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'story.db'));
db.pragma('journal_mode = WAL');

export const initStoryDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_story_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '未命名故事',
      premise TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '第0章',
      chapter_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_story_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      idx INTEGER NOT NULL,
      action TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      choices_json TEXT NOT NULL DEFAULT '[]',
      summary TEXT NOT NULL DEFAULT '',
      progress TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES apps_story_sessions(id) ON DELETE CASCADE
    )
  `);

  // migration: 旧表字段兼容
  try {
    const cols = db.prepare('PRAGMA table_info(apps_story_sessions)').all().map(c => c.name);
    if (!cols.includes('chapter_count') && cols.includes('total_chapters')) {
      db.exec('ALTER TABLE apps_story_sessions RENAME COLUMN total_chapters TO chapter_count');
    } else if (!cols.includes('chapter_count')) {
      db.exec('ALTER TABLE apps_story_sessions ADD COLUMN chapter_count INTEGER NOT NULL DEFAULT 0');
    }
    if (!cols.includes('premise') && cols.includes('story_prompt')) {
      db.exec('ALTER TABLE apps_story_sessions RENAME COLUMN story_prompt TO premise');
    } else if (!cols.includes('premise')) {
      db.exec('ALTER TABLE apps_story_sessions ADD COLUMN premise TEXT NOT NULL DEFAULT \'\'');
    }
  } catch {}
};
