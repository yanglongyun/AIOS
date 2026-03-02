import { db } from '../db.js';

export const listReportsHandler = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
  const safePageSize = Number.isFinite(Number(pageSize)) ? Math.min(30, Math.max(1, Number(pageSize))) : 10;
  const offset = (safePage - 1) * safePageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_briefing_reports').get().c || 0;
  const rows = db.prepare(`
    SELECT id, title, requirement, content_markdown, created_at
    FROM apps_briefing_reports
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(safePageSize, offset);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    requirement: r.requirement || '',
    preview: String(r.content_markdown || '').replace(/^#.*$/m, '').trim().slice(0, 160),
    createdAt: r.created_at
  }));

  return {
    success: true,
    items,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize))
  };
};
