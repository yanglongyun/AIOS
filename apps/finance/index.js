import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { initFinanceDatabase, getTransactions, createTransaction, deleteTransaction } from './db.js';

export { initFinanceDatabase };

export async function handleFinanceApi(req, res, path) {
  if (path === '/api/apps/finance/list' && req.method === 'GET') {
    return json(res, { success: true, data: getTransactions() });
  }
  if (path === '/api/apps/finance/create' && req.method === 'POST') {
    const data = await readBody(req);
    createTransaction(data);
    return json(res, { success: true });
  }
  if (path === '/api/apps/finance/delete' && req.method === 'POST') {
    const { id } = await readBody(req);
    deleteTransaction(id);
    return json(res, { success: true });
  }
  return false;
}
