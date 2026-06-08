// @ts-nocheck
// 待办 app 后端。独立库 database/apps/todo.db,只暴露 /apps/todo/*。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../system/ai/llm/stream.js";
import { getServerSettings } from "../../system/services/settings/index.js";
import { randomUUID } from "node:crypto";

let db;

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
};

const initDb = () => {
  if (db) return db;
  db = createAppDb("todo.db");
  createSchema();
  return db;
};

const normalizeSubtasks = (value) => {
  if (!Array.isArray(value)) throw badRequest("subtasks must be an array");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw badRequest("subtask must be an object");
    }
    const id = String(item.id || "").trim();
    const text = String(item.text || "").trim();
    if (!id) throw badRequest("subtask.id is required");
    if (!text) throw badRequest("subtask.text is required");
    return { id, text, done: item.done === true };
  });
};

const parseStoredSubtasks = (value) => {
  const parsed = JSON.parse(String(value || "[]"));
  return normalizeSubtasks(parsed);
};

const normalizeSection = (value) => {
  if (value === "today" || value === "later") return value;
  throw badRequest("section must be today or later");
};
const normalizePriority = (value) => {
  if (value === "" || value == null || value === "high") return value || "";
  throw badRequest("priority must be high or empty");
};
const encodeSubtasks = (value) => JSON.stringify(normalizeSubtasks(value || []));
const mapTodo = (row) => ({
  ...row,
  done: !!row.done,
  priority: row.priority || "",
  subtasks: parseStoredSubtasks(row.subtasks),
});

const listTodos = () =>
  db.prepare(`
    SELECT * FROM todos
    ORDER BY
      CASE section WHEN 'today' THEN 0 ELSE 1 END,
      done ASC,
      id DESC
  `).all().map(mapTodo);
const getTodo = (id) => db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id)) || null;

const createTodo = ({ text, section = "today", priority = "", subtasks = [] }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const row = db.prepare(`
    INSERT INTO todos (text, section, priority, subtasks)
    VALUES (?, ?, ?, ?)
    RETURNING *
  `).get(value, normalizeSection(section), normalizePriority(priority), encodeSubtasks(subtasks));
  return mapTodo(row);
};

const updateTodo = (id, { text, done, section, priority, subtasks }) => {
  const todo = getTodo(id);
  if (!todo) return null;
  const row = db.prepare(
    `UPDATE todos
     SET text = ?, done = ?, section = ?, priority = ?, subtasks = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
     RETURNING *`,
  ).get(
    text == null ? todo.text : String(text),
    done == null ? todo.done : done ? 1 : 0,
    section == null ? todo.section : normalizeSection(section),
    priority == null ? todo.priority : normalizePriority(priority),
    subtasks == null ? todo.subtasks : encodeSubtasks(subtasks),
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

const parseDecomposeResult = (content) => {
  const text = String(content || "").trim();
  const parsed = JSON.parse(text);
  const items = parsed?.subtasks;
  if (!Array.isArray(items)) throw new Error("LLM response must include subtasks array");
  const subtasks = items.map((item) => {
    if (typeof item !== "string") throw new Error("LLM subtasks must be strings");
    return item.trim();
  }).filter(Boolean);
  if (!subtasks.length) throw new Error("LLM response contains no subtasks");
  return subtasks;
};

const decomposeTodo = async ({ text = "" }) => {
  const value = String(text || "").trim();
  if (!value) throw badRequest("text is required");
  const settings = getLlmConfig();
  const result = await callLlmStream(settings.provider, settings.apiUrl, settings.apiKey, {
    model: settings.model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "你是 AIOS 待办应用的任务拆解助手。只输出 JSON,不要解释。" },
      { role: "user", content: `把这个待办拆成 3 到 6 个可执行子任务。输出格式: {"subtasks":["子任务1","子任务2"]}\n\n${value}` },
    ],
  });
  return parseDecomposeResult(result.message?.content).map((item) => ({
    id: randomUUID(),
    text: item,
    done: false,
  }));
};

const match = (path) => path === "/apps/todo/todos" || path === "/apps/todo/decompose";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/todo/decompose") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, subtasks: await decomposeTodo(body) });
    return true;
  }

  if (path !== "/apps/todo/todos") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, todos: listTodos() });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, todo: createTodo(body) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const body = parseJson(await readBody(req));
    const todo = updateTodo(id, body);
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
