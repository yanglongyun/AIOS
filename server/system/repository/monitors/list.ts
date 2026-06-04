// @ts-nocheck
import { getDb } from "../db.js";

const listMonitorRows = ({ status, conversationId } = {}) => {
  const where = [];
  const params = [];
  if (status) {
    where.push("status = ?");
    params.push(String(status));
  }
  if (conversationId) {
    where.push("conversation_id = ?");
    params.push(String(conversationId));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return getDb().prepare(`
    SELECT * FROM monitors
    ${clause}
    ORDER BY id DESC
  `).all(...params);
};

export { listMonitorRows };
