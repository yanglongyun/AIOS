// @ts-nocheck
// 待办 HTTP 层:method/路径分发、参数校验,调 service。
import { readBody, sendJson, parseJson } from "../../shared/http.js";
import {
  initDb,
  listTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  parseTodo,
  decomposeTodo,
  planToday,
} from "../service/index.js";

const match = (path) =>
  path === "/apps/todo/todos" ||
  path === "/apps/todo/parse" ||
  path === "/apps/todo/decompose" ||
  path === "/apps/todo/plan";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/todo/parse") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, ...(await parseTodo(parseJson(await readBody(req)))) });
    return true;
  }
  if (path === "/apps/todo/decompose") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, ...(await decomposeTodo(parseJson(await readBody(req)))) });
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

export { match, handleApi, initDb };
