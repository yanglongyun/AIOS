// @ts-nocheck
import { getDb } from "../db.js";

// 查所有匹配 (kind, source_id, event) 且仍 active 的监视器
const findActiveMonitorRows = ({ kind = "task", sourceId, event }) => {
  return getDb().prepare(`
    SELECT * FROM monitors
    WHERE kind = ? AND source_id = ? AND event = ? AND status = 'active'
    ORDER BY id ASC
  `).all(String(kind), String(sourceId), String(event));
};

const getMonitorRow = (id) => {
  return getDb().prepare("SELECT * FROM monitors WHERE id = ?").get(Number(id)) || null;
};

export { findActiveMonitorRows, getMonitorRow };
