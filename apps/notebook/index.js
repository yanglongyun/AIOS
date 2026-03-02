import { readBody } from '../app_shared/utils/readBody.js';
import { json } from '../app_shared/utils/json.js';
import { initNotebookDatabase } from './db.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';
import { updateHandler } from './api/update.js';
import { deleteHandler } from './api/delete.js';
import { pinHandler } from './api/pin.js';

export { initNotebookDatabase };

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
