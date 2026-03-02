import { db } from '../db.js';

export const syncHandler = (body = {}) => {
  const outlineId = String(body.outlineId || '').trim();
  const title = String(body.title || '').trim() || '心树';
  const dataValue = body.data;

  if (!outlineId) {
    return { status: 400, message: 'outlineId is required' };
  }

  let dataText = '[]';
  if (Array.isArray(dataValue)) {
    dataText = JSON.stringify(dataValue);
  } else if (typeof dataValue === 'string') {
    try {
      JSON.parse(dataValue);
      dataText = dataValue;
    } catch {
      return { status: 400, message: 'data must be valid JSON' };
    }
  } else if (dataValue != null) {
    return { status: 400, message: 'data must be array or JSON string' };
  }

  const exists = db.prepare('SELECT id FROM apps_mindtree_docs WHERE id = ?').get(outlineId);
  if (exists) {
    db.prepare(`
      UPDATE apps_mindtree_docs
      SET title = ?, data = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, dataText, outlineId);
  } else {
    db.prepare(`
      INSERT INTO apps_mindtree_docs (id, title, data, updated_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(outlineId, title, dataText);
  }

  return {
    success: true,
    outlineId,
    title,
    data: dataText
  };
};
