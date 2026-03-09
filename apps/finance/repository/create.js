import { db } from './client.js';

export const createTransaction = ({ type, amount, note }) => {
  db.prepare('INSERT INTO finance_transactions (type, amount, note) VALUES (?, ?, ?)').run(type, amount, note);
};
