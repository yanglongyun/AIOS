// @ts-nocheck
// 记事本 HTTP 层:method/路径分发、参数校验,调 service。
import { readBody, sendJson, parseJson } from "../../shared/http.js";
import {
  initDb,
  listFolders,
  listNotes,
  createFolder,
  createNote,
  updateNote,
  deleteNote,
  polishNote,
} from "../service/index.js";

const match = (path) =>
  path === "/apps/notepad/notes" ||
  path === "/apps/notepad/folders" ||
  path === "/apps/notepad/polish";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/notepad/polish") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 200, { ok: true, ...(await polishNote(body)) });
    return true;
  }

  if (path === "/apps/notepad/folders") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    sendJson(res, 201, { ok: true, folder: createFolder(body), folders: listFolders() });
    return true;
  }

  if (path !== "/apps/notepad/notes") return false;
  const id = url.searchParams.get("id");

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, notes: listNotes(), folders: listFolders() });
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

export { match, handleApi, initDb };
