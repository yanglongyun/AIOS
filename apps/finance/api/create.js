import { db } from '../db.js';

export const createHandler = (body = {}) => {
  db
    .prepare('INSERT INTO finance_transactions (type, amount, note) VALUES (?, ?, ?)')
    .run(body.type, body.amount, body.note);
  return { success: true };
};
