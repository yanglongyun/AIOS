// @ts-nocheck
// 记账本 app 后端。独立库 database/apps/ledger.db,只暴露 /apps/ledger/*。
import { createAppDb } from "../_shared/db.js";
import { readBody, sendJson, parseJson } from "../_shared/http.js";

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
  `);
  return db;
};

const listEntries = () => db.prepare("SELECT * FROM entries ORDER BY occurred_on DESC, id DESC").all();

const summary = () => {
  const income = Number(db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM entries WHERE type='income'").get().s) || 0;
  const expense = Number(db.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM entries WHERE type='expense'").get().s) || 0;
  return { income, expense, balance: income - expense };
};

const createEntry = ({ type = "expense", amount = 0, category = "", note = "", occurredOn }) => {
  const kind = type === "income" ? "income" : "expense";
  const value = Math.abs(Number(amount) || 0);
  const day = String(occurredOn || "").trim();
  if (day) {
    return db.prepare(
      "INSERT INTO entries (type, amount, category, note, occurred_on) VALUES (?, ?, ?, ?, ?) RETURNING *",
    ).get(kind, value, String(category), String(note), day);
  }
  return db.prepare(
    "INSERT INTO entries (type, amount, category, note) VALUES (?, ?, ?, ?) RETURNING *",
  ).get(kind, value, String(category), String(note));
};

const deleteEntry = (id) => db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id));

const match = (path) => path.startsWith("/apps/ledger/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path !== "/apps/ledger/entries") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, entries: listEntries(), summary: summary() });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, entry: createEntry(body), summary: summary() });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    deleteEntry(id);
    sendJson(res, 200, { ok: true, summary: summary() });
    return true;
  }
  return false;
};

export default { name: "ledger", match, handleApi, initDb };
