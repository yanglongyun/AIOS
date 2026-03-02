import { db } from '../../app_shared/db/client.js';

export const listHandler = () => {
  const data = db.prepare('SELECT * FROM finance_transactions ORDER BY date DESC').all();
  return { success: true, data };
};
