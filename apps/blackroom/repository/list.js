import { db } from './client.js';

export const countRecords = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM apps_blackroom_records').get().c || 0;
};

export const getStats = () => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total_count,
      COALESCE(SUM(poop_count), 0) AS total_poop
    FROM apps_blackroom_records
  `).get();
  return {
    totalCount: Number(stats.total_count || 0),
    totalPoop: Number(stats.total_poop || 0)
  };
};

export const listRecords = ({ limit, offset }) => {
  return db.prepare(`
    SELECT
      id,
      complaint,
      poop_count AS poopCount,
      agent_response AS agentResponse,
      created_at AS createdAt
    FROM apps_blackroom_records
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
};
