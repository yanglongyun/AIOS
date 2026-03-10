import { json } from '../../app_shared/utils/json.js';
import { readBody } from '../../app_shared/utils/readBody.js';
import { initFinanceDatabase } from '../repository/init.js';
import { listHandler } from './list.js';
import { createHandler } from './create.js';
import { deleteHandler } from './delete.js';
import { updateHandler } from './update.js';

export { initFinanceDatabase };

export async function handleFinanceApi(req, res, path) {
  if (path === '/apps/finance/list' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const query = Object.fromEntries(url.searchParams);
    return json(res, listHandler(query));
  }

  if (path === '/apps/finance/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createHandler(body));
  }

  if (path === '/apps/finance/update' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, updateHandler(body));
  }

  if (path === '/apps/finance/delete' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, deleteHandler(body));
  }

  return false;
}
