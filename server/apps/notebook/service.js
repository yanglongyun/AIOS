import * as repo from "./repository.js";
import { instantTask } from "../app_shared/instantTask.js";

const clean = (v, max = 200000) => String(v ?? "").slice(0, max);
const cleanTitle = (v) => clean(v, 120).trim();
const cleanSummary = (v) => clean(v, 600).trim();
const cleanAccess = (v) => {
  const access = String(v || "none").trim();
  return access === "summary" || access === "full" ? access : "none";
};

// ---- Folders -----------------------------------------------------------

const listFolders = () => ({ items: repo.listFolders() });

const createFolder = (body = {}) => {
  const name = cleanTitle(body.name) || "未命名";
  return { item: repo.createFolder({ name }) };
};

const updateFolder = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  if (!repo.getFolder(id)) return { error: "笔记本不存在", status: 404 };
  const name = cleanTitle(body.name);
  if (!name) return { error: "名称不能为空", status: 400 };
  return { item: repo.updateFolder({ id, name }) };
};

const removeFolder = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  return repo.deleteFolder({ id });
};

// ---- Notes -------------------------------------------------------------

const listNotes = (query = {}) => {
  const folderId = query.folderId != null ? Number(query.folderId) : undefined;
  return { items: repo.listNotes({ folderId }) };
};

const createNote = (body = {}) => {
  const title = cleanTitle(body.title) || "未命名";
  const summary = cleanSummary(body.summary);
  const content = clean(body.content);
  const access = cleanAccess(body.access);
  const folderId = body.folderId != null ? Number(body.folderId) : null;
  return { item: repo.createNote({ title, summary, content, access, folderId }) };
};

const updateNote = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  if (!repo.getNote(id)) return { error: "笔记不存在", status: 404 };
  const patch = {};
  if (body.title !== undefined) patch.title = cleanTitle(body.title) || "未命名";
  if (body.summary !== undefined) patch.summary = cleanSummary(body.summary);
  if (body.content !== undefined) patch.content = clean(body.content);
  if (body.access !== undefined) patch.access = cleanAccess(body.access);
  if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
  if (body.folderId !== undefined) patch.folderId = body.folderId === null ? null : Number(body.folderId);
  return { item: repo.updateNote({ id, ...patch }) };
};

const removeNote = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  return repo.deleteNote({ id });
};

// ---- Polish (润色) ------------------------------------------------------

const polish = async (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "缺少合法 id", status: 400 };
  const note = repo.getNote(id);
  if (!note) return { error: "笔记不存在", status: 404 };
  if (!note.content.trim()) return { error: "内容为空,无法润色", status: 400 };

  const prompt = [
    "请润色以下文字,保持原意、语气和结构,只改善表达的流畅性和准确性。",
    "直接返回润色后的全文,不要加任何解释、标题或前后说明。",
    "",
    note.content,
  ].join("\n");

  let result;
  try {
    result = await instantTask({
      app: "notebook",
      title: `润色:${note.title}`,
      prompt,
      meta: { noteId: id, kind: "polish" },
    });
  } catch (err) {
    return { error: err.message || "AI 润色失败", status: 502 };
  }

  const polished = result?.response || "";
  if (!polished.trim()) return { error: "AI 没有返回结果", status: 502 };
  return { polished };
};

export {
  listFolders, createFolder, updateFolder, removeFolder,
  listNotes, createNote, updateNote, removeNote,
  polish,
};
