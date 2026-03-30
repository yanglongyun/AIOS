import { db } from "./client.js";
import { getSystemLanguage } from "../../app_shared/settings/language.js";
const FINANCE_SEEDS_BY_LANGUAGE = {
  zh: [
    ["income", 88e4, "\u5356\u6389\u4E86\u8001\u5BB6\u7956\u4F20\u7684\u9668\u77F3\uFF0C\u9274\u5B9A\u8BF4\u662F\u706B\u661F\u6765\u7684", "2026-01-03 09:15:00"],
    ["income", 52e3, "\u5E2E\u90BB\u5C45\u5927\u5988\u8BBE\u8BA1\u4E86\u4E00\u6B3E\u5E7F\u573A\u821E\u961F\u670D\uFF0C\u7206\u5355\u4E86", "2026-01-18 11:00:00"],
    ["income", 15e3, "\u6559\u697C\u4E0B\u5496\u5561\u5E97\u8001\u677F\u62C9\u82B1\uFF0C\u4ED6\u6309\u676F\u4ED8\u8D39", "2026-02-14 08:30:00"],
    ["expense", 14e4, "\u51B2\u52A8\u4E70\u4E86\u4E00\u5339\u9000\u5F79\u8D5B\u9A6C\uFF0C\u8BF4\u662F\u8981\u966A\u5B83\u8DD1\u6B65", "2026-02-20 14:30:00"],
    ["expense", 299, "\u7ED9\u81EA\u5DF1\u4E70\u4E86\u4E00\u672C\u300A\u5982\u4F55\u505C\u6B62\u4E71\u82B1\u94B1\u300B", "2026-03-03 15:30:00"]
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
