import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { db } from '../app_shared/db/client.js';
import { getHandler } from './api/get.js';
import { syncHandler } from './api/sync.js';

export const initWriterpadDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_writerpad_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '写字板',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS apps_writerpad_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'global',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_apps_writerpad_messages_doc_created
    ON apps_writerpad_messages (doc_id, created_at);
  `);
};

export const handleWriterpadApi = async (req, res, path) => {
  if (path === '/api/apps/writerpad/get' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const data = getHandler({ id: url.searchParams.get('id') });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (path === '/api/apps/writerpad/sync' && req.method === 'POST') {
    const body = await readBody(req);
    const data = syncHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }


  return false;
};
