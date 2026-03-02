import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'lovehouse.db'));
db.pragma('journal_mode = WAL');

export const initLovehouseDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_lovehouse_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      scene TEXT DEFAULT 'sunset',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_lovehouse_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_lovehouse_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'url',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const exists = db.prepare('SELECT key FROM apps_lovehouse_settings WHERE key = ?').get('current_scene');
  if (!exists) {
    db.prepare('INSERT INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('current_scene', 'sunset');
  }
};
