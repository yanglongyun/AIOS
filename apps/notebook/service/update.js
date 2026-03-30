import { updateNoteContent } from "../repository/update.js";
const updateNotebook = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: "\u7F3A\u5C11 id", status: 400 };
  updateNoteContent({ id, content: body.content || "" });
  return { ok: true };
};
export {
  updateNotebook
};
