import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { listHandler } from './api/list.js';
import { latestHandler } from './api/latest.js';
import { detailHandler } from './api/detail.js';
import { createHandler } from './api/create.js';

export const initPlaygroundDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS playground_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '未命名场景',
      prompt TEXT DEFAULT '',
      html TEXT NOT NULL,
      suggestions TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};

export const handlePlaygroundApi = async (req, res, pathName) => {
  if (pathName === '/api/apps/playground/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (pathName === '/api/apps/playground/latest' && req.method === 'GET') {
    return json(res, latestHandler());
  }

  if (pathName === '/api/apps/playground/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = detailHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/api/apps/playground/create' && req.method === 'POST') {
    const body = await readBody(req);
    const data = createHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
