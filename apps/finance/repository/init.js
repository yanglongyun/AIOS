import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const FINANCE_SEEDS_BY_LANGUAGE = {
  zh: [
    ["income", 88e4, "卖掉了老家祖传的陨石，鉴定说是火星来的", "2026-01-03 09:15:00"],
    ["income", 52e3, "帮邻居大妈设计了一款广场舞队服，爆单了", "2026-01-18 11:00:00"],
    ["income", 15e3, "教楼下咖啡店老板拉花，他按杯付费", "2026-02-14 08:30:00"],
    ["expense", 14e4, "冲动买了一匹退役赛马，说是要陪它跑步", "2026-02-20 14:30:00"],
    ["expense", 299, "给自己买了一本《如何停止乱花钱》", "2026-03-03 15:30:00"]
  ],
  en: [
    ["income", 88e4, "Sold a family meteorite from my hometown; appraisal said it was from Mars", "2026-01-03 09:15:00"],
    ["income", 52e3, "Designed dance team uniforms for a neighbor and it unexpectedly went viral", "2026-01-18 11:00:00"],
    ["income", 15e3, "Taught the cafe owner downstairs latte art and got paid per cup", "2026-02-14 08:30:00"],
    ["expense", 14e4, "Impulse-bought a retired racehorse and promised to run with it daily", "2026-02-20 14:30:00"],
    ["expense", 299, 'Bought a book titled "How to Stop Impulse Spending"', "2026-03-03 15:30:00"]
  ]
};
const initFinanceTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
const seedFinanceIfEmpty = () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM finance_transactions").get().c;
  if (count !== 0) return;
  const language = getSystemLanguage();
  const seeds = FINANCE_SEEDS_BY_LANGUAGE[language];
  if (!seeds) {
    throw new Error(`Unsupported system language: ${language}`);
  }
  const insert = db.prepare(`
    INSERT INTO finance_transactions (type, amount, note, date)
    VALUES (?, ?, ?, ?)
  `);
  for (const [type, amount, note, date] of seeds) {
    insert.run(type, amount, note, date);
  }
};
const initFinanceDatabase = () => {
  initFinanceTables();
  seedFinanceIfEmpty();
};
export {
  initFinanceDatabase
};
