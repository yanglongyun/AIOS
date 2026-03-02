import { db } from '../../app_shared/db/client.js';

export const createHandler = (body = {}) => {
  const r = db
    .prepare("INSERT INTO apps_notes (content, updated_at) VALUES (?, datetime('now'))")
    .run(body.content || '');
  return { id: r.lastInsertRowid };
};
