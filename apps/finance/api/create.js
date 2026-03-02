import { db } from '../../app_shared/db/client.js';

export const createHandler = (body = {}) => {
  db
    .prepare('INSERT INTO finance_transactions (type, amount, category, note) VALUES (?, ?, ?, ?)')
    .run(body.type, body.amount, body.category, body.note);
  return { success: true };
};
