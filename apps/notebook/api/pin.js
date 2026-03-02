import { db } from '../../app_shared/db/client.js';

export const pinHandler = (body = {}) => {
  if (!body.id) return { error: '缺少 id', status: 400 };
  db.prepare('UPDATE apps_notes SET pinned = ? WHERE id = ?').run(body.pinned ? 1 : 0, body.id);
  return { ok: true };
};
