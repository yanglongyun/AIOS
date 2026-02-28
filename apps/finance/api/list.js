import { db } from '../../db/client.js';

export const listHandler = () => {
  const data = db.prepare('SELECT * FROM finance_transactions ORDER BY date DESC').all();
  return { success: true, data };
};
