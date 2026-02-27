import { updateNotebookNote } from '../db.js';

export const updateHandler = (body = {}) => {
  if (!body.id) return { error: '缺少 id', status: 400 };
  return updateNotebookNote(body.id, body.content || '');
};
