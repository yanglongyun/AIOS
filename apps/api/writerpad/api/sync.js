import { db } from '../../../db/client.js';

export const syncHandler = (body = {}) => {
  const docId = String(body.docId || '').trim();
  const title = String(body.title || '').trim() || '写字板';
  const content = String(body.content || '');

  if (!docId) return { status: 400, message: 'docId is required' };

  const exists = db.prepare('SELECT id FROM apps_writerpad_docs WHERE id = ?').get(docId);
  if (exists) {
    db.prepare(`
      UPDATE apps_writerpad_docs
      SET title = ?, content = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, content, docId);
  } else {
    db.prepare(`
      INSERT INTO apps_writerpad_docs (id, title, content, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(docId, title, content);
  }

  return {
    success: true,
    docId,
    title,
    content
  };
};
