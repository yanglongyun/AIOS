import { json } from '../app_shared/utils/json.js';
import { readBody } from '../app_shared/utils/readBody.js';
import { initFinanceDatabase } from './db.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';
import { deleteHandler } from './api/delete.js';

export { initFinanceDatabase };

export async function handleFinanceApi(req, res, path) {
  if (path === '/api/apps/finance/list' && req.method === 'GET') {
    return json(res, listHandler());
  }

  if (path === '/api/apps/finance/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  if (path === '/api/apps/finance/delete' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, deleteHandler(body));
  }

  return false;
}
