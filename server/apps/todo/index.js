// @ts-nocheck
// 待办 app 后端。对齐 AIOS:自然语言解析、截止日期、完成时间、行内拆解和今日规划。
import { randomUUID } from "node:crypto";
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../ai/llm.js";
import { getServerSettings } from "../../service/settings/index.js";

let db;

const hasColumn = (table, name) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === name);

const createSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      section TEXT NOT NULL DEFAULT 'today' CHECK (section IN ('today', 'later')),
      priority TEXT,
      subtasks TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  if (!hasColumn("todos", "due")) db.exec("ALTER TABLE todos ADD COLUMN due TEXT");
  if (!hasColumn("todos", "done_at")) db.exec("ALTER TABLE todos ADD COLUMN done_at DATETIME");
};

const initDb = () => {
  if (db) return db;
  db = createAppDb("todo.db");
  createSchema();
  return db;
};

const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayKey = () => dateKey(new Date());

const normalizeSubtasks = (value) => {
  if (!Array.isArray(value)) throw badRequest("subtasks must be an array");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw badRequest("subtask must be an object");
    const id = String(item.id || "").trim();
    const text = String(item.text || "").trim();
    if (!id) throw badRequest("subtask.id is required");
    if (!text) throw badRequest("subtask.text is required");
    return { id, text, done: item.done === true };
  });
};

const parseStoredSubtasks = (value) => {
  try {
    return normalizeSubtasks(JSON.parse(String(value || "[]")));
  } catch {
    return [];
  }
};

const normalizeSection = (value) => {
  if (value === "today" || value === "later") return value;
  throw badRequest("section must be today or later");
};

const normalizePriority = (value) => {
  if (value === "" || value == null || value === "high") return value || "";
  throw badRequest("priority must be high or empty");
};

const normalizeDue = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw badRequest("due must be YYYY-MM-DD");
  return text;
};

const encodeSubtasks = (value) => JSON.stringify(normalizeSubtasks(value || []));
const mapTodo = (row) => ({
  ...row,
  done: !!row.done,
  priority: row.priority || "",
  due: row.due || "",
  doneAt: row.done_at || "",
  subtasks: parseStoredSubtasks(row.subtasks),
});

const listTodos = () => db.prepare(`
  SELECT * FROM todos
  ORDER BY
    done ASC,
    CASE section WHEN 'today' THEN 0 ELSE 1 END,
    CASE priority WHEN 'high' THEN 0 ELSE 1 END,
    COALESCE(due, '9999-99-99') ASC,
    id DESC
`).all().map(mapTodo);

const getTodo = (id) => {
  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id));
  return row ? mapTodo(row) : null;
};

const createTodo = ({ text, section = "today", priority = "", subtasks = [], due = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const row = db.prepare(`
    INSERT INTO todos (text, section, priority, subtasks, due)
    VALUES (?, ?, ?, ?, ?)
    RETURNING *
  `).get(value, normalizeSection(section), normalizePriority(priority), encodeSubtasks(subtasks), normalizeDue(due));
  return mapTodo(row);
};

const updateTodo = (id, input = {}) => {
  const todo = getTodo(id);
  if (!todo) return null;
  const done = input.done == null ? todo.done : !!input.done;
  const doneAt = done ? (todo.doneAt || new Date().toISOString()) : null;
  const row = db.prepare(`
    UPDATE todos
    SET text = ?, done = ?, section = ?, priority = ?, subtasks = ?, due = ?,
        done_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(
    input.text == null ? todo.text : String(input.text),
    done ? 1 : 0,
    input.section == null ? todo.section : normalizeSection(input.section),
    input.priority == null ? todo.priority : normalizePriority(input.priority),
    input.subtasks == null ? JSON.stringify(todo.subtasks) : encodeSubtasks(input.subtasks),
    input.due == null ? (todo.due || null) : normalizeDue(input.due),
    doneAt,
    Number(id),
  );
  return mapTodo(row);
};

const deleteTodo = (id) => db.prepare("DELETE FROM todos WHERE id = ?").run(Number(id));

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

const runJsonLlm = async (messages) => {
  const settings = getLlmConfig();
  const result = await callLlmStream(settings.apiUrl, settings.apiKey, {
    model: settings.model,
    response_format: { type: "json_object" },
    messages,
  });
  return parseLlmJson(result.message?.content);
};

const parseTodo = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const data = await runJsonLlm([
    {
      role: "system",
      content: [
        "你是 Agent 待办应用的自然语言解析任务。不要调用工具。只输出 JSON。",
        `今天日期: ${todayKey()}`,
        "输出字段固定: text, due, priority, section。",
        "due 为空字符串或 YYYY-MM-DD。priority 为 high 或空字符串。section 为 today 或 later。",
        "理解今天/明天/后天/周X/下周X/X月X日/之前/前/重要/紧急。",
        "规则: due <= 今天则 section=today; 未来 due 则 section=later; 无 due 则 section=today。",
      ].join("\n"),
    },
    { role: "user", content: value },
  ]);
  return {
    text: String(data.text || value).trim(),
    due: normalizeDue(data.due || "") || "",
    priority: normalizePriority(data.priority || ""),
    section: normalizeSection(data.section || "today"),
  };
};

const decomposeTodo = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const data = await runJsonLlm([
    { role: "system", content: "你是 Agent 待办应用的任务拆解任务。不要调用工具。只输出 JSON。" },
    { role: "user", content: `把待办拆成 3 到 6 个可执行子任务。输出格式: {"subtasks":["子任务1","子任务2"]}\n\n${value}` },
  ]);
  const items = Array.isArray(data.subtasks) ? data.subtasks : [];
  return items.map((item) => String(item).trim()).filter(Boolean).map((item) => ({
    id: randomUUID(),
    text: item,
    done: false,
  }));
};

const planToday = async () => {
  const candidates = listTodos().filter((item) => !item.done && item.section === "later").slice(0, 30);
  const data = await runJsonLlm([
    {
      role: "system",
      content: [
        "你是 Agent 待办应用的今日安排任务。不要调用工具。只输出 JSON。",
        "从稍后未完成项里选最多 3 件建议移到今天。",
        "优先级: 期限临近 > 高优先 > 搁置最久。",
        "输出格式: {\"picks\":[{\"id\":1,\"reason\":\"理由\"}],\"note\":\"一句鼓励\"}",
      ].join("\n"),
    },
    { role: "user", content: JSON.stringify(candidates.map(({ id, text, due, priority, created_at }) => ({ id, text, due, priority, created_at }))) },
  ]);
  const ids = new Set(candidates.map((item) => Number(item.id)));
  const picks = (Array.isArray(data.picks) ? data.picks : [])
    .map((item) => ({ id: Number(item.id), reason: String(item.reason || "").trim() }))
    .filter((item) => ids.has(item.id))
    .slice(0, 3);
  return { picks, note: String(data.note || "") };
};

const match = (path) =>
  path === "/apps/todo/todos" ||
  path === "/apps/todo/parse" ||
  path === "/apps/todo/decompose" ||
  path === "/apps/todo/plan";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/todo/parse") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, result: await parseTodo(parseJson(await readBody(req))) });
    return true;
  }
  if (path === "/apps/todo/decompose") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, subtasks: await decomposeTodo(parseJson(await readBody(req))) });
    return true;
  }
  if (path === "/apps/todo/plan") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, ...(await planToday()) });
    return true;
  }

  if (path !== "/apps/todo/todos") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, todos: listTodos() });
    return true;
  }
  if (req.method === "POST") {
    sendJson(res, 201, { ok: true, todo: createTodo(parseJson(await readBody(req))) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const todo = updateTodo(id, parseJson(await readBody(req)));
    if (!todo) return sendJson(res, 404, { ok: false, error: "todo not found" });
    sendJson(res, 200, { ok: true, todo });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    deleteTodo(id);
    sendJson(res, 200, { ok: true });
    return true;
  }
  return false;
};

export default { name: "todo", match, handleApi, initDb };
