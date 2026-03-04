import { db } from '../db.js';

export const updateHandler = (body = {}) => {
  const pageId = Number(body.pageId || 0);
  const content = String(body.content ?? '');
  if (!pageId) return { status: 400, message: '缺少 pageId' };

  const info = db.prepare('UPDATE apps_redmill_pages SET content = ? WHERE id = ?').run(content, pageId);
  if (!info.changes) return { status: 404, message: '页面不存在' };

  return { success: true };
};
