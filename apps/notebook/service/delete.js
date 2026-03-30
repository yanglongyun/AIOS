import { deleteNoteById } from "../repository/delete.js";
const deleteNotebook = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "\u7F3A\u5C11 id", status: 400 };
  deleteNoteById(id);
  return { ok: true };
};
export {
  deleteNotebook
};
