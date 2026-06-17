// @ts-nocheck
// 记账本 app 后端。对齐 AIOS:月度、预算、分类 meta、编辑和多笔智能记账。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../ai/llm.js";
import { getServerSettings } from "../../service/settings/index.js";

let db;

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

const mapEntry = (row) => ({ ...row, occurredOn: row.occurred_on });

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
  const value = db.prepare("SELECT value FROM meta WHERE key = 'budget'").get()?.value;
  try {
    return Number(JSON.parse(value || "3000")) || 3000;
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
  const row = entry.occurredOn
    ? db.prepare("INSERT INTO entries (type, amount, category, note, occurred_on) VALUES (?, ?, ?, ?, ?) RETURNING *")
      .get(entry.type, entry.amount, entry.category, entry.note, entry.occurredOn)
    : db.prepare("INSERT INTO entries (type, amount, category, note) VALUES (?, ?, ?, ?) RETURNING *")
      .get(entry.type, entry.amount, entry.category, entry.note);
  return mapEntry(row);
};

const getEntry = (id) => db.prepare("SELECT * FROM entries WHERE id = ?").get(Number(id)) || null;

const updateEntry = (id, input = {}) => {
  const current = getEntry(id);
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

const getLlmConfig = () => {
  const settings = getServerSettings();
  const missing = [];
  if (!settings.apiUrl) missing.push("apiUrl");
  if (!settings.apiKey) missing.push("apiKey");
  if (!settings.model) missing.push("model");
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  return settings;
};

const parseLlmJson = (content) => {
  const text = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(text);
};

const runLedgerLlm = async (messages) => {
  const settings = getLlmConfig();
  const result = await callLlmStream(settings.apiUrl, settings.apiKey, {
    model: settings.model,
    response_format: { type: "json_object" },
    messages,
  });
  return parseLlmJson(result.message?.content);
};

const parseEntry = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const data = await runLedgerLlm([
    {
      role: "system",
      content: [
        "你是 Agent 记账本的智能输入解析任务。不要调用工具。只输出 JSON。",
        "输出字段固定为 type, amount, category, note, occurredOn。",
        "type 只能是 expense 或 income。",
        `category 从 ${CATEGORIES.map((item) => item.name).join("、")} 中选择。`,
        "amount 是正数。",
        "occurredOn 支持用户说的昨天/前天/X月X日;如果用户没明确日期,输出空字符串。",
        `今天: ${new Date().toISOString().slice(0, 10)}`,
      ].join("\n"),
    },
    { role: "user", content: value },
  ]);
  return normalizeEntry(data);
};

const smartRecord = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const today = new Date().toISOString().slice(0, 10);
  const parsed = await runLedgerLlm([
    {
      role: "system",
      content: [
        "你是 Agent 记账本的智能记账任务。不要调用工具,不要输出多余文字,只输出 JSON。",
        "把用户输入解析成一条或多条账目,输出格式固定为:",
        '{"entries":[{"type":"expense|income","amount":数字,"name":"名称","category":"分类","date":"YYYY-MM-DD","note":"可选备注"}]}',
        "- type 只能是 expense 或 income,发工资/收款等是 income,其余默认 expense。",
        "- amount 是正数。",
        `- category 从 ${CATEGORIES.map((item) => item.name).join("、")} 中选择,没有合适的用「其他」。`,
        "- date 是 YYYY-MM-DD;相对日期要换算成具体日期;用户没说日期则用今天。",
        "- 一句话里包含多笔账目时输出多条 entries。",
        "- 解析不出任何账目时输出 {\"entries\":[]}。",
        `今天: ${today}`,
      ].join("\n"),
    },
    { role: "user", content: value },
  ]);
  const list = Array.isArray(parsed?.entries) ? parsed.entries : [];
  const inserted = [];
  let skipped = 0;
  for (const item of list) {
    try {
      const type = item?.type === "income" ? "income" : item?.type === "expense" ? "expense" : null;
      const amount = Number(item?.amount);
      const date = String(item?.date || today).trim();
      if (!type || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        skipped += 1;
        continue;
      }
      const category = categorySet.has(String(item?.category || "").trim()) ? String(item.category).trim() : "其他";
      const name = String(item?.name || "").trim();
      const extra = String(item?.note || "").trim();
      const note = name && extra && extra !== name ? `${name}（${extra}）` : name || extra;
      inserted.push(createEntry({ type, amount, category, note, occurredOn: date }));
    } catch {
      skipped += 1;
    }
  }
  return { entries: inserted, skipped };
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
    sendJson(res, 200, { ok: true, budget: setBudget(parseJson(await readBody(req)).amount) });
    return true;
  }
  if (path === "/apps/ledger/smart") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, ...(await smartRecord(parseJson(await readBody(req)))) });
    return true;
  }
  if (path === "/apps/ledger/parse") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, entry: await parseEntry(parseJson(await readBody(req))) });
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
    sendJson(res, 201, { ok: true, entry: createEntry(parseJson(await readBody(req))), summary: summary(month) });
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
