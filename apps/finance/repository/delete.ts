import { db } from './client.ts';

export const deleteTransactionById = (id) => {
  db.prepare('DELETE FROM finance_transactions WHERE id = ?').run(id);
};
