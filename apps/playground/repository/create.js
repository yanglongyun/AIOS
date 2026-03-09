import { db } from './client.js';

export const insertVersion = ({ name, prompt, html }) => {
  const r = db.prepare(
    "INSERT INTO playground_versions (name, prompt, html, created_at) VALUES (?, ?, ?, datetime('now'))"
  ).run(name, prompt, html);
  return Number(r.lastInsertRowid);
};
