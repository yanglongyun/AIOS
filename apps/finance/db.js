import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join } from 'path';

const dir = join(process.cwd(), 'database', 'apps');
mkdirSync(dir, { recursive: true });

export const db = new Database(join(dir, 'finance.db'));
db.pragma('journal_mode = WAL');

export const initFinanceDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 迁移：删除旧 category 列
  try {
    const cols = db.prepare('PRAGMA table_info(finance_transactions)').all();
    if (cols.some(c => c.name === 'category')) {
      db.exec('ALTER TABLE finance_transactions DROP COLUMN category');
    }
  } catch {}
};
