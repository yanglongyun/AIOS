import { json } from '../app_shared/utils/json.js';
import { readBody } from '../app_shared/utils/readBody.js';
import { db } from '../app_shared/db/client.js';
import { listHandler } from './api/list.js';
import { createHandler } from './api/create.js';
import { deleteHandler } from './api/delete.js';

export function initFinanceDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

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
