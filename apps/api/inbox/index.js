import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readBody } from '../../utils/readBody.js';
import { json } from '../../utils/json.js';
import { db } from '../../db/client.js';
import { listHandler } from './api/list.js';
import { submitHandler } from './api/submit.js';
import { readHandler } from './api/read.js';
import { deleteHandler } from './api/delete.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const initInboxDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inbox_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      content TEXT NOT NULL,
      source_ip TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
};

const getSourceIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
};

export const handleInboxApi = async (req, res, pathName) => {
  if (pathName === '/inbox/submit' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(__dirname, 'public/submit.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (pathName === '/api/apps/inbox/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({ read: url.searchParams.get('read') || 'all' }));
  }

  if (pathName === '/api/apps/inbox/submit' && req.method === 'POST') {
    const body = await readBody(req);
    const data = submitHandler(body, getSourceIp(req));
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/api/apps/inbox/read' && req.method === 'POST') {
    const body = await readBody(req);
    const data = readHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/api/apps/inbox/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
