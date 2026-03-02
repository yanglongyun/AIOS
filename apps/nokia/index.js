import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { generationHandler } from './api/generation.js';
import { progressHandler } from './api/progress.js';

export const initNokiaDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_nokia_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_screen TEXT NOT NULL DEFAULT '{}',
      screen_history TEXT DEFAULT '{}',
      battery_level INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
};

export const handleNokiaApi = async (req, res, path) => {
  if (path === '/api/apps/nokia/generation' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generationHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/nokia/progress' && req.method === 'GET') {
    return json(res, progressHandler());
  }

  return false;
};
