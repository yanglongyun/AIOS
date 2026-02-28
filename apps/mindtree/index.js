import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { db } from '../db/client.js';
import { getHandler } from './api/get.js';
import { syncHandler } from './api/sync.js';
import { chatHandler } from './api/chat.js';

export const initMindtreeDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_mindtree_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '心树',
      data TEXT NOT NULL DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_mindtree_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outline_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_apps_mindtree_messages_outline_created
    ON apps_mindtree_messages (outline_id, created_at);
  `);
};

export const handleMindtreeApi = async (req, res, path) => {
  const isGetPath = path === '/api/apps/mindtree/get';
  const isSyncPath = path === '/api/apps/mindtree/sync';
  const isChatPath = path === '/api/apps/mindtree/chat';

  if (isGetPath && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = getHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (isSyncPath && req.method === 'POST') {
    const body = await readBody(req);
    const data = syncHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (isChatPath && req.method === 'POST') {
    const body = await readBody(req);
    const data = await chatHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
