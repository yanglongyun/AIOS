// @ts-nocheck
// 待办 app 后端。独立库 database/apps/todo.db,只暴露 /apps/todo/*。
import { createAppDb } from "../_shared/db.js";
import { readBody, sendJson, parseJson } from "../_shared/http.js";

let db;

const initDb = () => {
  if (db) return db;
  db = createAppDb("todo.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
};

const listTodos = () =>
  db.prepare("SELECT * FROM todos ORDER BY done ASC, id DESC").all().map((row) => ({ ...row, done: !!row.done }));
const getTodo = (id) => db.prepare("SELECT * FROM todos WHERE id = ?").get(Number(id)) || null;

const createTodo = ({ text }) => {
  const value = String(text || "").trim();
  if (!value) throw new Error("text is required");
  const row = db.prepare("INSERT INTO todos (text) VALUES (?) RETURNING *").get(value);
  return { ...row, done: !!row.done };
};

const updateTodo = (id, { text, done }) => {
  const todo = getTodo(id);
  if (!todo) return null;
  const row = db.prepare(
    "UPDATE todos SET text = ?, done = ? WHERE id = ? RETURNING *",
  ).get(
    text == null ? todo.text : String(text),
    done == null ? todo.done : done ? 1 : 0,
    Number(id),
  );
  return { ...row, done: !!row.done };
};

const deleteTodo = (id) => db.prepare("DELETE FROM todos WHERE id = ?").run(Number(id));

const match = (path) => path.startsWith("/apps/todo/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path !== "/apps/todo/todos") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, todos: listTodos() });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    try {
      sendJson(res, 201, { ok: true, todo: createTodo(body) });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
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
