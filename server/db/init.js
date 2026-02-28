import { db } from './client.js';


export const initDatabase = () => {
  db.pragma('foreign_keys = OFF');

  db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      message TEXT NOT NULL,
      meta TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

  `);

  try {
    db.exec('ALTER TABLE messages ADD COLUMN meta TEXT');
  } catch {}

  try {
    db.exec("ALTER TABLE chats ADD COLUMN description TEXT DEFAULT ''");
  } catch {}

  const initSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  initSetting.run('contextRounds', '30');
  initSetting.run('apiUrl', 'https://api.openai.com/v1/chat/completions');
  initSetting.run('apiKey', '');
  initSetting.run('model', 'gpt-4o-mini');
  initSetting.run('enableFollowupSuggestions', '1');
};
