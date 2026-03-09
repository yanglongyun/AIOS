import { db } from './client.js';

export const createNote = ({ content = '', style = null } = {}) => {
  const s = style ?? Math.floor(Math.random() * 12);
  const r = db.prepare("INSERT INTO apps_notes (content, style, updated_at) VALUES (?, ?, datetime('now'))").run(content, s);
  return Number(r.lastInsertRowid);
};
