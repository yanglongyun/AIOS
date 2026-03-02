import { db } from '../../app_shared/db/client.js';

export const getHandler = ({ id } = {}) => {
  const outlineId = String(id || '').trim();
  if (!outlineId) {
    return { status: 400, message: 'id is required' };
  }

  const outline = db.prepare(`
    SELECT id, title, data, created_at, updated_at
    FROM apps_mindtree_docs
    WHERE id = ?
  `).get(outlineId);

  if (!outline) {
    return { status: 404, message: 'outline not found' };
  }

  const messages = db.prepare(`
    SELECT role, content, created_at
    FROM apps_mindtree_messages
    WHERE outline_id = ?
    ORDER BY id ASC
  `).all(outlineId);

  return {
    success: true,
    outline: {
      id: outline.id,
      title: outline.title || '无标题大纲',
      data: outline.data || '[]',
      created_at: outline.created_at,
      updated_at: outline.updated_at
    },
    messages
  };
};
