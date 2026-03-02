import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { messagesHandler } from './api/messages.js';
import { chatHandler } from './api/chat.js';
import { sceneHandler } from './api/scene.js';
import { generateHandler } from './api/generate.js';
import { getSettingsHandler, updateSettingsHandler } from './api/settings.js';
import { photosHandler } from './api/photos.js';

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

  // 默认场景
  const exists = db.prepare('SELECT key FROM apps_lovehouse_settings WHERE key = ?').get('current_scene');
  if (!exists) {
    db.prepare('INSERT INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('current_scene', 'sunset');
  }
};

export const handleLovehouseApi = async (req, res, path) => {
  if (path === '/api/apps/lovehouse/messages' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, messagesHandler({ limit }));
  }

  if (path === '/api/apps/lovehouse/chat' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await chatHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/lovehouse/scene' && req.method === 'POST') {
    const body = await readBody(req);
    const data = sceneHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/lovehouse/generate' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await generateHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/lovehouse/photos' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = Number(url.searchParams.get('limit') || 50);
    return json(res, photosHandler({ limit }));
  }

  if (path === '/api/apps/lovehouse/settings' && req.method === 'GET') {
    return json(res, getSettingsHandler());
  }

  if (path === '/api/apps/lovehouse/settings' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, updateSettingsHandler(body));
  }

  return false;
};
