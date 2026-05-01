import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
} from "./repository.js";

const cleanTitle = (value) => String(value || "").trim().slice(0, 120);
const cleanContent = (value) => String(value || "").slice(0, 200000);

const list = () => ({ items: listNotes() });

const create = (body = {}) => {
  const title = cleanTitle(body.title) || "未命名";
  const content = cleanContent(body.content);
  return { item: createNote({ title, content }) };
};

const update = (body = {}) => {
  const id = Number(body.id || 0);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Invalid id", status: 400 };
  }
  const patch = { id };
  if (body.title !== undefined) patch.title = cleanTitle(body.title) || "未命名";
  if (body.content !== undefined) patch.content = cleanContent(body.content);
  if (body.pinned !== undefined) patch.pinned = Boolean(body.pinned);
  const item = updateNote(patch);
  if (!item) return { error: "Not found", status: 404 };
  return { item };
};

const remove = (body = {}) => {
  const id = Number(body.id || 0);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Invalid id", status: 400 };
  }
  return deleteNote({ id });
};

export {
  list,
  create,
  update,
  remove,
};
