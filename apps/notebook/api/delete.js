import { deleteNotebookNote } from '../db.js';

export const deleteHandler = (body = {}) => {
  if (!body.id) return { error: '缺少 id', status: 400 };
  return deleteNotebookNote(body.id);
};
