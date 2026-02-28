import { db } from '../../../db/client.js';

export const getHandler = ({ id } = {}) => {
  const docId = String(id || '').trim();
  if (!docId) return { status: 400, message: 'id is required' };

  const doc = db.prepare(`
    SELECT id, title, content, created_at, updated_at
    FROM apps_writerpad_docs
    WHERE id = ?
  `).get(docId);
  if (!doc) return { status: 404, message: 'doc not found' };

  const messages = db.prepare(`
    SELECT role, content, mode, created_at
    FROM apps_writerpad_messages
    WHERE doc_id = ?
    ORDER BY id ASC
  `).all(docId);

  return {
    success: true,
    doc,
    messages
  };
};
