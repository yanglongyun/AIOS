import { db } from '../../app_shared/db/client.js';

export const createHandler = (body = {}) => {
  const name = String(body.name || '').trim().slice(0, 80) || '未命名场景';
  const prompt = String(body.prompt || '').trim().slice(0, 2000);
  const html = String(body.html || '').trim();
  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions.map(s => String(s || '').trim()).filter(Boolean).slice(0, 3)
    : [];

  if (!html) return { success: false, message: '缺少 html', status: 400 };

  const r = db.prepare(
    "INSERT INTO playground_versions (name, prompt, html, suggestions, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
  ).run(name, prompt, html, JSON.stringify(suggestions));

  return { success: true, id: Number(r.lastInsertRowid) };
};
