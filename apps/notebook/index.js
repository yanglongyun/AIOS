import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';
import { updateHandler } from './api/update.js';
import { deleteHandler } from './api/delete.js';
import { pinHandler } from './api/pin.js';

export const initNotebookDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL DEFAULT '',
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const columns = db.prepare("PRAGMA table_info('apps_notes')").all();
  const hasPinned = columns.some(col => col.name === 'pinned');
  if (!hasPinned) {
    db.exec('ALTER TABLE apps_notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;');
  }
};

export const handleNotebookApi = async (req, res, path) => {
  if (path === '/api/apps/notebook/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const q = url.searchParams.get('q') || '';
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Number(url.searchParams.get('pageSize') || 10);
    return json(res, listHandler({ q, page, pageSize }));
  }

  if (path === '/api/apps/notebook/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  if (path === '/api/apps/notebook/update' && req.method === 'POST') {
    const body = await readBody(req);
    const data = updateHandler(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  if (path === '/api/apps/notebook/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  if (path === '/api/apps/notebook/pin' && req.method === 'POST') {
    const body = await readBody(req);
    const data = pinHandler(body);
    if (data?.error) return json(res, { error: data.error }, data.status || 400);
    return json(res, data);
  }

  return false;
};
