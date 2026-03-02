import { db } from '../db.js';

export const deleteHandler = (body = {}) => {
  db.prepare('DELETE FROM finance_transactions WHERE id = ?').run(body.id);
  return { success: true };
};
