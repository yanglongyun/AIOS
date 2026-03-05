import fs from 'fs';
import path from 'path';
import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initInboxDatabase } from './db.js';
import { listHandler } from './api/list.js';
import { submitHandler } from './api/submit.js';
import { readHandler } from './api/read.js';
import { deleteHandler } from './api/delete.js';
import { suggestHandler } from './api/suggest.js';

export { initInboxDatabase };

const getSourceIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
};

export const handleInboxApi = async (req, res, pathName) => {
  if (pathName === '/apps/inbox/submit' && req.method === 'GET') {
    const html = fs.readFileSync(path.join(process.cwd(), 'public', 'apps', 'inbox', 'submit.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (pathName === '/apps/inbox/list' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, listHandler({ read: url.searchParams.get('read') || 'all' }));
  }

  if (pathName === '/apps/inbox/submit' && req.method === 'POST') {
    const body = await readBody(req);
    const data = submitHandler(body, getSourceIp(req));
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/inbox/read' && req.method === 'POST') {
    const body = await readBody(req);
    const data = readHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/inbox/delete' && req.method === 'POST') {
    const body = await readBody(req);
    const data = deleteHandler(body);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  if (pathName === '/apps/inbox/suggest' && req.method === 'POST') {
    const body = await readBody(req);
    const data = await suggestHandler(body, req);
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }

  return false;
};
