import { db } from '../db.js';

export const listHandler = ({ page = 1, pageSize = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(30, Math.max(1, Number(pageSize) || 10));
  const offset = (safePage - 1) * safePageSize;

  const total = db.prepare('SELECT COUNT(*) AS c FROM apps_blackroom_records').get().c || 0;
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_count,
      COALESCE(SUM(poop_count), 0) AS total_poop
    FROM apps_blackroom_records
  `).get();

  const items = db.prepare(`
    SELECT
      id,
      complaint,
      poop_count AS poopCount,
      agent_response AS agentResponse,
      created_at AS createdAt
    FROM apps_blackroom_records
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(safePageSize, offset);

  return {
    success: true,
    items,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    stats: {
      totalCount: Number(stats.total_count || 0),
      totalPoop: Number(stats.total_poop || 0)
    }
  };
};

