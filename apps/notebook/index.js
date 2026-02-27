import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { initNotebookDatabase } from './db.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';
import { updateHandler } from './api/update.js';
import { deleteHandler } from './api/delete.js';

export { initNotebookDatabase };

export const handleNotebookApi = async (req, res, path) => {
  if (path === '/api/apps/notebook/list' && req.method === 'GET') {
    return json(res, listHandler());
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

  return false;
};
