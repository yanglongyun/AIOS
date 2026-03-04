import { db } from '../db.js';

export const createHandler = (body = {}) => {
  const name = String(body.name || '').trim().slice(0, 80) || '未命名场景';
  const prompt = String(body.prompt || '').trim().slice(0, 2000);
  const html = String(body.html || '').trim();

  if (!html) return { success: false, message: '缺少 html', status: 400 };

  const r = db.prepare(
    "INSERT INTO playground_versions (name, prompt, html, created_at) VALUES (?, ?, ?, datetime('now'))"
  ).run(name, prompt, html);

  return { success: true, id: Number(r.lastInsertRowid) };
};
