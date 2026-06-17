// @ts-nocheck
// 记事本 app 后端。对齐 AIOS:文件夹、标签、置顶、颜色、emoji 和自由 AI 写作。
import { createAppDb } from "../shared/db.js";
import { readBody, sendJson, parseJson, badRequest } from "../shared/http.js";
import { callLlmStream } from "../../ai/llm.js";
import { getServerSettings } from "../../service/settings/index.js";

let db;

const FOLDER_SEEDS = [
  ["工作", "#a06c3a"],
  ["生活", "#5b8a4e"],
  ["灵感", "#b0719a"],
];
const COLORS = ["#a06c3a", "#5b8a4e", "#b0719a", "#4e7a8a", "#8a6c4e"];

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
  if (!hasColumn("notes", "color")) db.exec("ALTER TABLE notes ADD COLUMN color TEXT NOT NULL DEFAULT ''");
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
const listNotes = () => db.prepare(`
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

const createNote = ({ title = "", content = "", folder = "", tags = [], pinned = false, emoji = "", color = "" }) =>
  mapNote(db.prepare(`
    INSERT INTO notes (title, content, folder, tags, pinned, emoji, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(String(title || ""), String(content || ""), String(folder || ""), encodeTags(tags), pinned ? 1 : 0, String(emoji || ""), String(color || "")));

const updateNote = (id, input = {}) => {
  const note = getNote(id);
  if (!note) return null;
  return mapNote(db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, folder = ?, tags = ?, pinned = ?, emoji = ?, color = ?,
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
    input.color == null ? note.color : String(input.color || ""),
    Number(id),
  ));
};

const deleteNote = (id) => db.prepare("DELETE FROM notes WHERE id = ?").run(Number(id));

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

const polishPrompts = {
  polish: "润色下面这段笔记。保留原意,让表达更自然、清晰、有质感。只输出 JSON: {\"content\":\"润色后的正文\"}",
  condense: "精简下面这段笔记。保留关键信息,去掉重复和松散表达。只输出 JSON: {\"content\":\"精简后的正文\"}",
  expand: "扩写下面这段笔记。基于原意补足细节和结构,不要编造具体事实。只输出 JSON: {\"content\":\"扩写后的正文\"}",
  title: "给下面这段笔记起一个 14 个汉字以内的标题。只输出 JSON: {\"content\":\"标题\"}",
  format: "把下面这段笔记整理成清晰 Markdown,可使用标题、列表、任务清单和引用。只输出 JSON: {\"content\":\"Markdown 正文\"}",
};

const polishNote = async ({ content = "", mode = "polish", prompt: userPrompt = "" }) => {
  const text = String(content || "").trim();
  const settings = getLlmConfig();
  const ask = String(userPrompt || "").trim();
  let messages;
  if (mode === "ask") {
    if (!ask) throw badRequest("prompt is required");
    messages = [
      { role: "system", content: "你是 Agent 记事本应用的写作助手。不要调用工具,不要保存数据。只输出 JSON: {\"content\":\"产出内容\"}" },
      { role: "user", content: `用户要求:\n${ask}\n\n当前笔记内容(上下文,可为空):\n${text}` },
    ];
  } else {
    if (!text && mode !== "expand") throw badRequest("content is required");
    const instruction = polishPrompts[mode];
    if (!instruction) throw badRequest("mode must be polish, condense, expand, title, format, or ask");
    messages = [
      { role: "system", content: "你是 Agent 记事本应用的写作任务。不要调用工具,不要保存数据。" },
      { role: "user", content: `${instruction}\n\n笔记内容:\n${text || "这是一篇空白笔记,请给出可继续写作的开头。"}` },
    ];
  }
  const result = await callLlmStream(settings.apiUrl, settings.apiKey, {
    model: settings.model,
    response_format: { type: "json_object" },
    messages,
  });
  const data = parseLlmJson(result.message?.content);
  return { mode, label: mode === "ask" ? "AI" : mode, content: String(data.content || "").trim(), usage: result.usage || null };
};

const match = (path) =>
  path === "/apps/notepad/notes" ||
  path === "/apps/notepad/folders" ||
  path === "/apps/notepad/polish";

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path === "/apps/notepad/polish") {
    if (req.method !== "POST") return false;
    sendJson(res, 200, { ok: true, result: await polishNote(parseJson(await readBody(req))) });
    return true;
  }
  if (path === "/apps/notepad/folders") {
    if (req.method !== "POST") return false;
    sendJson(res, 201, { ok: true, folder: createFolder(parseJson(await readBody(req))), folders: listFolders() });
    return true;
  }

  if (path !== "/apps/notepad/notes") return false;
  const id = url.searchParams.get("id");
  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, notes: listNotes(), folders: listFolders() });
    return true;
  }
  if (req.method === "POST") {
    sendJson(res, 201, { ok: true, note: createNote(parseJson(await readBody(req))) });
    return true;
  }
  if (req.method === "PATCH") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    const note = updateNote(id, parseJson(await readBody(req)));
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
