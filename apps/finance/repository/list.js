import { db } from './client.js';

export const listTransactions = () => {
  return db.prepare('SELECT * FROM finance_transactions ORDER BY date DESC').all();
};
