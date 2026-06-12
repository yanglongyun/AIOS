// @ts-nocheck
// 记账本数据层:建库、迁移、全部 SQL。
import { createAppDb } from "../../shared/db.js";
import { badRequest } from "../../shared/http.js";

let db;

const initDb = () => {
  if (db) return db;
  db = createAppDb("ledger.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'expense',
      amount REAL NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      occurred_on TEXT NOT NULL DEFAULT (date('now')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('budget', ?)").run(JSON.stringify(3000));
  return db;
};

const monthClause = (month) => {
  const value = String(month || "").trim();
  if (!value) return { where: "", binds: [] };
  if (!/^\d{4}-\d{2}$/.test(value)) throw badRequest("month must be YYYY-MM");
  return { where: "WHERE substr(occurred_on, 1, 7) = ?", binds: [value] };
};

const selectEntries = (month = "") => {
  const clause = monthClause(month);
  return db.prepare(`
    SELECT * FROM entries
    ${clause.where}
    ORDER BY occurred_on DESC, id DESC
  `).all(...clause.binds);
};

const selectEntry = (id) => db.prepare("SELECT * FROM entries WHERE id = ?").get(Number(id));

const selectBudgetValue = () => db.prepare("SELECT value FROM meta WHERE key = 'budget'").get()?.value;

const upsertBudgetValue = (value) =>
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('budget', ?)").run(value);

const insertEntry = ({ type, amount, category, note, occurredOn }) =>
  occurredOn
    ? db.prepare("INSERT INTO entries (type, amount, category, note, occurred_on) VALUES (?, ?, ?, ?, ?) RETURNING *")
      .get(type, amount, category, note, occurredOn)
    : db.prepare("INSERT INTO entries (type, amount, category, note) VALUES (?, ?, ?, ?) RETURNING *")
      .get(type, amount, category, note);

const updateEntryRow = (id, { type, amount, category, note, occurredOn }) =>
  db.prepare(`
    UPDATE entries
    SET type = ?, amount = ?, category = ?, note = ?, occurred_on = ?
    WHERE id = ?
    RETURNING *
  `).get(type, amount, category, note, occurredOn, Number(id));

const deleteEntryRow = (id) => db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id));

export { initDb, selectEntries, selectEntry, selectBudgetValue, upsertBudgetValue, insertEntry, updateEntryRow, deleteEntryRow };
