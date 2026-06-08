// @ts-nocheck
// 记事本 app 后端。独立库 database/apps/notepad.db,只暴露 /apps/notepad/*。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson } from "../shared/http.js";

let db;

const initDb = () => {
  if (db) return db;
  db = createAppDb("notepad.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
};

const listNotes = () => db.prepare("SELECT * FROM notes ORDER BY updated_at DESC, id DESC").all();
const getNote = (id) => db.prepare("SELECT * FROM notes WHERE id = ?").get(Number(id)) || null;

const createNote = ({ title = "", content = "" }) =>
  db.prepare(
    "INSERT INTO notes (title, content) VALUES (?, ?) RETURNING *",
  ).get(String(title), String(content));

const updateNote = (id, { title, content }) => {
  const note = getNote(id);
  if (!note) return null;
  return db.prepare(
    `UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? RETURNING *`,
  ).get(title == null ? note.title : String(title), content == null ? note.content : String(content), Number(id));
};

const deleteNote = (id) => db.prepare("DELETE FROM notes WHERE id = ?").run(Number(id));

const match = (path) => path === "/apps/notepad/notes" || path.startsWith("/apps/notepad/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path !== "/apps/notepad/notes") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, notes: listNotes() });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, note: createNote(body) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const body = parseJson(await readBody(req));
    const note = updateNote(id, body);
    if (!note) return sendJson(res, 404, { ok: false, error: "note not found" });
    sendJson(res, 200, { ok: true, note });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    deleteNote(id);
    sendJson(res, 200, { ok: true });
    return true;
  }
  return false;
};

export default { name: "notepad", match, handleApi, initDb };
