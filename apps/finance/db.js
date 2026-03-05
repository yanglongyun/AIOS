import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');
const dir = join(root, 'database', 'apps');
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

  // 预置数据
  const count = db.prepare('SELECT COUNT(*) as c FROM finance_transactions').get().c;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO finance_transactions (type, amount, note, date)
      VALUES (?, ?, ?, ?)
    `);
    const seeds = [
      ['income',  880000, '卖掉了老家祖传的陨石，鉴定说是火星来的', '2026-01-03 09:15:00'],
      ['income',  52000,  '帮邻居大妈设计了一款广场舞队服，爆单了', '2026-01-18 11:00:00'],
      ['income',  15000,  '教楼下咖啡店老板拉花，他按杯付费', '2026-02-14 08:30:00'],
      ['expense', 140000, '冲动买了一匹退役赛马，说是要陪它跑步', '2026-02-20 14:30:00'],
      ['expense', 299,    '给自己买了一本《如何停止乱花钱》', '2026-03-03 15:30:00'],
    ];
    for (const [type, amount, note, date] of seeds) {
      insert.run(type, amount, note, date);
    }
  }
};
