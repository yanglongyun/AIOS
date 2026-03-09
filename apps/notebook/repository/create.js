import { db } from './client.js';

export const createNote = ({ content = '' } = {}) => {
  const r = db.prepare("INSERT INTO apps_notes (content, updated_at) VALUES (?, datetime('now'))").run(content);
  return Number(r.lastInsertRowid);
};
