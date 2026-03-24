import { json } from '../../../shared/http/json.ts';
import { readBody } from '../../../shared/http/readBody.ts';
import { listFinance } from '../service/list.ts';
import { createFinance } from '../service/create.ts';
import { deleteFinance } from '../service/delete.ts';
import { updateFinance } from '../service/update.ts';

export async function handleFinanceApi(req, res, path) {
  if (path === '/apps/finance/list' && req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const query = Object.fromEntries(url.searchParams);
    return json(res, listFinance(query.month));
  }

  if (path === '/apps/finance/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createFinance(body));
  }

  if (path === '/apps/finance/update' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, updateFinance(body));
  }

  if (path === '/apps/finance/delete' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, deleteFinance(body));
  }

  return false;
}
