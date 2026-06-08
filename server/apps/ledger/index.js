// @ts-nocheck
// 记账本 app 后端。独立库 database/apps/ledger.db,只暴露 /apps/ledger/*。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../system/ai/llm/stream.js";
import { getServerSettings } from "../../system/services/settings/index.js";

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

const categories = new Set(["餐饮", "交通", "购物", "居住", "娱乐", "医疗", "工资", "其他"]);

const normalizeEntry = ({ type, amount, category = "", note = "", occurredOn }) => {
  if (type !== "income" && type !== "expense") throw badRequest("type must be income or expense");
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest("amount must be positive");
  const cat = String(category || "").trim();
  if (!categories.has(cat)) throw badRequest("category is invalid");
  return {
    type,
    amount: value,
    category: cat,
    note: String(note || "").trim(),
    occurredOn: String(occurredOn || "").trim(),
  };
};

const createEntry = (input) => {
  const entry = normalizeEntry(input || {});
  const day = entry.occurredOn;
  if (day) {
    return db.prepare(
      "INSERT INTO entries (type, amount, category, note, occurred_on) VALUES (?, ?, ?, ?, ?) RETURNING *",
    ).get(entry.type, entry.amount, entry.category, entry.note, day);
  }
  return db.prepare(
    "INSERT INTO entries (type, amount, category, note) VALUES (?, ?, ?, ?) RETURNING *",
  ).get(entry.type, entry.amount, entry.category, entry.note);
};

const deleteEntry = (id) => db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id));

const getLlmConfig = () => {
  const settings = getServerSettings();
  const missing = [];
  if (!settings.apiUrl) missing.push("apiUrl");
  if (!settings.apiKey) missing.push("apiKey");
  if (!settings.model) missing.push("model");
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  return settings;
};

const parseLedgerJson = (content) => {
  const text = String(content || "").trim();
  const parsed = JSON.parse(text);
  try {
    return normalizeEntry(parsed);
  } catch (error) {
    throw new Error(`LLM ledger response invalid: ${error.message}`);
  }
};

const parseEntry = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const settings = getLlmConfig();
  const result = await callLlmStream(settings.provider, settings.apiUrl, settings.apiKey, {
    model: settings.model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "你是 AIOS 记账本的智能输入解析器。",
          "只输出 JSON,不要解释。",
          "输出字段固定为 type, amount, category, note, occurredOn。",
          "type 只能是 expense 或 income。",
          "category 从 餐饮、交通、购物、居住、娱乐、医疗、工资、其他 中选择。",
          "amount 是正数。",
          "occurredOn 如果用户没明确日期,输出空字符串。",
        ].join("\n"),
      },
      { role: "user", content: value },
    ],
  });
  return parseLedgerJson(result.message?.content);
};

const match = (path) => path.startsWith("/apps/ledger/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/ledger/parse") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, entry: await parseEntry(body) });
    return true;
  }

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
