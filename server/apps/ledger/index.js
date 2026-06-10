// @ts-nocheck
// 记账本 app 后端。应用自治:独立库、独立迁移、AI 统一创建 AIOS task。
import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import { createTask, getTask } from "../../system/services/tasks/index.js";

let db;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DB_DIR = path.resolve(__dirname, "../../../database/apps");

const createAppDb = (filename) => {
  fs.mkdirSync(APPS_DB_DIR, { recursive: true });
  const appDb = new DatabaseSync(path.join(APPS_DB_DIR, filename));
  appDb.exec("PRAGMA journal_mode = WAL");
  return appDb;
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload)}\n`);
};

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const parseJson = (raw, label = "json") => {
  const input = String(raw ?? "").trim();
  if (!input) throw badRequest(`Invalid JSON in ${label}: empty input`);
  try {
    return JSON.parse(input);
  } catch (error) {
    throw badRequest(`Invalid JSON in ${label}: ${error.message}`);
  }
};

const CATEGORIES = [
  { name: "餐饮", emoji: "🍜", color: "#e87850" },
  { name: "交通", emoji: "🚕", color: "#4e8fb8" },
  { name: "购物", emoji: "🛍️", color: "#c06aa0" },
  { name: "居住", emoji: "🏠", color: "#a06c3a" },
  { name: "娱乐", emoji: "🎮", color: "#8a6cc0" },
  { name: "医疗", emoji: "💊", color: "#50a878" },
  { name: "工资", emoji: "💼", color: "#4b9b58" },
  { name: "其他", emoji: "✨", color: "#b89545" },
];
const categorySet = new Set(CATEGORIES.map((item) => item.name));

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

const mapEntry = (row) => ({
  ...row,
  occurredOn: row.occurred_on,
});

const listEntries = (month = "") => {
  const clause = monthClause(month);
  return db.prepare(`
    SELECT * FROM entries
    ${clause.where}
    ORDER BY occurred_on DESC, id DESC
  `).all(...clause.binds).map(mapEntry);
};

const summary = (month = "") => {
  const entries = listEntries(month);
  const income = entries.filter((x) => x.type === "income").reduce((s, x) => s + Number(x.amount || 0), 0);
  const expense = entries.filter((x) => x.type === "expense").reduce((s, x) => s + Number(x.amount || 0), 0);
  return { income, expense, balance: income - expense };
};

const getBudget = () => {
  const row = db.prepare("SELECT value FROM meta WHERE key = 'budget'").get();
  try {
    return Number(JSON.parse(row?.value || "3000")) || 3000;
  } catch {
    return 3000;
  }
};
const setBudget = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest("amount must be positive");
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('budget', ?)").run(JSON.stringify(value));
  return value;
};

const normalizeEntry = ({ type, amount, category = "", note = "", occurredOn }) => {
  if (type !== "income" && type !== "expense") throw badRequest("type must be income or expense");
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest("amount must be positive");
  const cat = String(category || "").trim();
  if (!categorySet.has(cat)) throw badRequest("category is invalid");
  const day = String(occurredOn || "").trim();
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw badRequest("occurredOn must be YYYY-MM-DD");
  return { type, amount: value, category: cat, note: String(note || "").trim(), occurredOn: day };
};

const createEntry = (input) => {
  const entry = normalizeEntry(input || {});
  const day = entry.occurredOn;
  const row = day
    ? db.prepare("INSERT INTO entries (type, amount, category, note, occurred_on) VALUES (?, ?, ?, ?, ?) RETURNING *")
      .get(entry.type, entry.amount, entry.category, entry.note, day)
    : db.prepare("INSERT INTO entries (type, amount, category, note) VALUES (?, ?, ?, ?) RETURNING *")
      .get(entry.type, entry.amount, entry.category, entry.note);
  return mapEntry(row);
};

const updateEntry = (id, input = {}) => {
  const current = db.prepare("SELECT * FROM entries WHERE id = ?").get(Number(id));
  if (!current) return null;
  const entry = normalizeEntry({
    type: input.type == null ? current.type : input.type,
    amount: input.amount == null ? current.amount : input.amount,
    category: input.category == null ? current.category : input.category,
    note: input.note == null ? current.note : input.note,
    occurredOn: input.occurredOn == null ? current.occurred_on : input.occurredOn,
  });
  return mapEntry(db.prepare(`
    UPDATE entries
    SET type = ?, amount = ?, category = ?, note = ?, occurred_on = ?
    WHERE id = ?
    RETURNING *
  `).get(entry.type, entry.amount, entry.category, entry.note, entry.occurredOn, Number(id)));
};

const deleteEntry = (id) => db.prepare("DELETE FROM entries WHERE id = ?").run(Number(id));

const waitTask = async (taskId, timeoutMs = 45000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const task = getTask(taskId);
    if (task?.status === "done") return task.response || "";
    if (task?.status === "error") throw new Error(task.error || "task failed");
    if (task?.status === "aborted") throw new Error("task aborted");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("task timeout");
};

const parseEntry = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const task = createTask({
    taskName: "ledger-parse",
    detail: [
      "你是 AIOS 记账本的智能输入解析任务。不要调用工具。只输出 JSON。",
      "输出字段固定为 type, amount, category, note, occurredOn。",
      "type 只能是 expense 或 income。",
      `category 从 ${CATEGORIES.map((item) => item.name).join("、")} 中选择。`,
      "amount 是正数。",
      "occurredOn 支持用户说的昨天/前天/X月X日;如果用户没明确日期,输出空字符串。",
      "",
      `今天: ${new Date().toISOString().slice(0, 10)}`,
      `用户输入: ${value}`,
    ].join("\n"),
  });
  const parsed = JSON.parse(await waitTask(task.taskId));
  return { taskId: task.taskId, entry: normalizeEntry(parsed) };
};

const match = (path) => path.startsWith("/apps/ledger/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/ledger/meta") {
    if (req.method !== "GET") return false;
    sendJson(res, 200, { ok: true, categories: CATEGORIES, budget: getBudget() });
    return true;
  }
  if (path === "/apps/ledger/budget") {
    if (req.method !== "PUT") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, budget: setBudget(body.amount) });
    return true;
  }
  if (path === "/apps/ledger/parse") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, ...(await parseEntry(body)) });
    return true;
  }

  if (path !== "/apps/ledger/entries") return false;
  const id = url.searchParams.get("id");
  const month = url.searchParams.get("month") || "";

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, entries: listEntries(month), summary: summary(month) });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, entry: createEntry(body), summary: summary(month) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const entry = updateEntry(id, parseJson(await readBody(req)));
    if (!entry) return sendJson(res, 404, { ok: false, error: "entry not found" });
    sendJson(res, 200, { ok: true, entry, summary: summary(month) });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    deleteEntry(id);
    sendJson(res, 200, { ok: true, summary: summary(month) });
    return true;
  }
  return false;
};

export default { name: "ledger", match, handleApi, initDb };
