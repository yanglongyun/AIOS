// @ts-nocheck
// 记事本 app 后端。应用自治:独立库、独立迁移、AI 统一创建 AIOS task。
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

const COLORS = ["#a06c3a", "#5b8a4e", "#b0719a", "#4e7a8a", "#8a6c4e"];
const FOLDER_SEEDS = [
  ["工作", "#a06c3a"],
  ["生活", "#5b8a4e"],
  ["灵感", "#b0719a"],
];

const hasColumn = (table, name) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((row) => row.name === name);

const migrate = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#a06c3a'
    );
  `);
  if (!hasColumn("notes", "folder")) db.exec("ALTER TABLE notes ADD COLUMN folder TEXT NOT NULL DEFAULT ''");
  if (!hasColumn("notes", "tags")) db.exec("ALTER TABLE notes ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'");
  if (!hasColumn("notes", "pinned")) db.exec("ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0");
  if (!hasColumn("notes", "emoji")) db.exec("ALTER TABLE notes ADD COLUMN emoji TEXT NOT NULL DEFAULT ''");
  const count = db.prepare("SELECT COUNT(*) AS n FROM folders").get().n;
  if (!count) {
    const stmt = db.prepare("INSERT OR IGNORE INTO folders (name, color) VALUES (?, ?)");
    for (const [name, color] of FOLDER_SEEDS) stmt.run(name, color);
  }
};

const initDb = () => {
  if (db) return db;
  db = createAppDb("notepad.db");
  migrate();
  return db;
};

const parseTags = (value) => {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const normalizeTags = (value) => {
  if (typeof value === "string") {
    return [...new Set(value.split(/[#,，\s]+/).map((item) => item.trim()).filter(Boolean))];
  }
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

const encodeTags = (value) => JSON.stringify(normalizeTags(value));

const mapNote = (row) => ({
  ...row,
  tags: parseTags(row.tags),
  pinned: !!row.pinned,
});

const listFolders = () => db.prepare("SELECT * FROM folders ORDER BY id ASC").all();
const listNotes = () =>
  db.prepare(`
    SELECT * FROM notes
    ORDER BY pinned DESC, datetime(updated_at) DESC, id DESC
  `).all().map(mapNote);
const getNote = (id) => {
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(Number(id));
  return row ? mapNote(row) : null;
};

const createFolder = ({ name = "" }) => {
  const value = String(name || "").trim();
  if (!value) throw badRequest("name is required");
  const color = COLORS[Math.abs(value.split("").reduce((n, ch) => n + ch.charCodeAt(0), 0)) % COLORS.length];
  return db.prepare("INSERT INTO folders (name, color) VALUES (?, ?) RETURNING *").get(value, color);
};

const createNote = ({ title = "", content = "", folder = "", tags = [], pinned = false, emoji = "" }) =>
  mapNote(db.prepare(`
    INSERT INTO notes (title, content, folder, tags, pinned, emoji)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(
    String(title || ""),
    String(content || ""),
    String(folder || ""),
    encodeTags(tags),
    pinned ? 1 : 0,
    String(emoji || ""),
  ));

const updateNote = (id, input = {}) => {
  const note = getNote(id);
  if (!note) return null;
  return mapNote(db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, folder = ?, tags = ?, pinned = ?, emoji = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `).get(
    input.title == null ? note.title : String(input.title),
    input.content == null ? note.content : String(input.content),
    input.folder == null ? note.folder : String(input.folder || ""),
    input.tags == null ? JSON.stringify(note.tags) : encodeTags(input.tags),
    input.pinned == null ? (note.pinned ? 1 : 0) : (input.pinned ? 1 : 0),
    input.emoji == null ? note.emoji : String(input.emoji || ""),
    Number(id),
  ));
};

const deleteNote = (id) => db.prepare("DELETE FROM notes WHERE id = ?").run(Number(id));

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

const parseTaskJson = (content) => {
  try {
    return JSON.parse(String(content || "{}"));
  } catch {
    return { content: String(content || "") };
  }
};

const polishPrompts = {
  polish: {
    label: "润色",
    instruction: "润色下面这段笔记。保留原意,让表达更自然、清晰、有质感。只输出 JSON: {\"content\":\"润色后的正文\"}",
  },
  condense: {
    label: "精简",
    instruction: "精简下面这段笔记。保留关键信息,去掉重复和松散表达。只输出 JSON: {\"content\":\"精简后的正文\"}",
  },
  expand: {
    label: "扩写",
    instruction: "扩写下面这段笔记。基于原意补足细节和结构,不要编造具体事实。只输出 JSON: {\"content\":\"扩写后的正文\"}",
  },
  title: {
    label: "起标题",
    instruction: "给下面这段笔记起一个 14 个汉字以内的标题。只输出 JSON: {\"content\":\"标题\"}",
  },
  format: {
    label: "排版",
    instruction: "把下面这段笔记整理成清晰 Markdown,可使用标题、列表、任务清单和引用。只输出 JSON: {\"content\":\"Markdown 正文\"}",
  },
};

const polishNote = async ({ content = "", mode = "polish" }) => {
  const text = String(content || "").trim();
  if (!text && mode !== "expand") throw badRequest("content is required");
  const prompt = polishPrompts[mode];
  if (!prompt) throw badRequest("mode must be polish, condense, expand, title, or format");
  const task = createTask({
    taskName: `notepad-${mode}`,
    detail: [
      "你是 AIOS 记事本应用的写作任务。不要调用工具,不要保存数据。",
      prompt.instruction,
      "",
      "笔记内容:",
      text || "这是一篇空白笔记,请给出可继续写作的开头。",
    ].join("\n"),
  });
  const data = parseTaskJson(await waitTask(task.taskId));
  return {
    taskId: task.taskId,
    result: {
      mode,
      label: prompt.label,
      content: String(data.content || "").trim(),
    },
  };
};

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

export default { name: "notepad", match, handleApi, initDb };
