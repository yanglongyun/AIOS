import { db } from '../db.js';

export const getReportHandler = ({ id } = {}) => {
  const reportId = Number(id);
  if (!Number.isInteger(reportId) || reportId <= 0) return { status: 400, message: 'id 无效' };

  const row = db.prepare(`
    SELECT id, title, requirement, content_markdown, sources_json, created_at
    FROM apps_briefing_reports
    WHERE id = ?
  `).get(reportId);

  if (!row) return { status: 404, message: '早报不存在' };

  return {
    success: true,
    report: {
      id: row.id,
      title: row.title,
      requirement: row.requirement || '',
      content: row.content_markdown,
      sources: (() => {
        try { return JSON.parse(row.sources_json || '[]'); } catch { return []; }
      })(),
      createdAt: row.created_at
    }
  };
};
