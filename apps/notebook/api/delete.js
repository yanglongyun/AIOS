import { db } from '../db.js';

export const deleteHandler = (body = {}) => {
  if (!body.id) return { error: '缺少 id', status: 400 };
  db.prepare('DELETE FROM apps_notes WHERE id = ?').run(body.id);
  return { ok: true };
};
