import { db } from '../db/client.js';

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

export function getTransactions() {
  return db.prepare('SELECT * FROM finance_transactions ORDER BY date DESC').all();
}

export function createTransaction({ type, amount, category, note }) {
  return db.prepare('INSERT INTO finance_transactions (type, amount, category, note) VALUES (?, ?, ?, ?)')
    .run(type, amount, category, note);
}

export function deleteTransaction(id) {
  return db.prepare('DELETE FROM finance_transactions WHERE id = ?').run(id);
}
