// @ts-nocheck
// 记事本 app 后端。独立库 database/apps/notepad.db,只暴露 /apps/notepad/*。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../system/ai/llm/stream.js";
import { getServerSettings } from "../../system/services/settings/index.js";

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

const polishPrompts = {
  polish: {
    label: "润色",
    instruction: "润色下面这段笔记。保留原意,让表达更自然、清晰、有质感。只输出润色后的正文,不要解释。",
  },
  condense: {
    label: "精简",
    instruction: "精简下面这段笔记。保留关键信息,去掉重复和松散表达。只输出精简后的正文,不要解释。",
  },
  expand: {
    label: "扩写",
    instruction: "扩写下面这段笔记。基于原意补足细节和结构,不要编造具体事实。只输出扩写后的正文,不要解释。",
  },
};

const getLlmConfig = () => {
  const settings = getServerSettings();
  const missing = [];
  if (!settings.apiUrl) missing.push("apiUrl");
  if (!settings.apiKey) missing.push("apiKey");
  if (!settings.model) missing.push("model");
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  return settings;
};

const polishNote = async ({ content = "", mode = "polish" }) => {
  const text = String(content || "").trim();
  if (!text) throw badRequest("content is required");
  const prompt = polishPrompts[mode];
  if (!prompt) throw badRequest("mode must be polish, condense, or expand");
  const settings = getLlmConfig();
  const result = await callLlmStream(settings.provider, settings.apiUrl, settings.apiKey, {
    model: settings.model,
    messages: [
      { role: "system", content: "你是 AIOS 记事本的写作助手。你的任务是处理用户当前笔记草稿,不保存数据,不执行工具。" },
      { role: "user", content: `${prompt.instruction}\n\n${text}` },
    ],
  });
  return {
    mode,
    label: prompt.label,
    content: String(result.message?.content || "").trim(),
    usage: result.usage || null,
  };
};

const match = (path) => path === "/apps/notepad/notes" || path === "/apps/notepad/polish";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/notepad/polish") {
    if (req.method !== "POST") return false;
    const body = parseJson(await readBody(req));
    const result = await polishNote(body);
    sendJson(res, 200, { ok: true, result });
    return true;
  }

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
