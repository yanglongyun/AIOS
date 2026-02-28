import { db } from '../../db/client.js';

export const updateHandler = (body = {}) => {
  if (!body.id) return { error: '缺少 id', status: 400 };
  db
    .prepare("UPDATE apps_notes SET content = ?, updated_at = datetime('now') WHERE id = ?")
    .run(body.content || '', body.id);
  return { ok: true };
};
