// @ts-nocheck
import { getDb } from "../../db.js";

const listChats = (options = {}) => {
  const db = getDb();
  const scene = options.scene ? String(options.scene) : null;
  const limit = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
    ? Math.floor(Number(options.limit))
    : null;
  const offset = Math.max(0, Math.floor(Number(options.offset || 0)));
  const filters = [];
  const params = [];

  if (scene) {
    filters.push("c.scene = ?");
    params.push(scene);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const total = Number(
    db.prepare(`SELECT COUNT(*) AS count FROM chats c ${where}`).get(...params)?.count
  ) || 0;

  const limitSql = limit ? "LIMIT ? OFFSET ?" : "";
  const rows = db.prepare(`
    SELECT c.id, c.title, c.description, c.scene, c.meta, c.state, c.pinned, c.created_at,
           COUNT(m.id) AS message_count
    FROM chats c
    LEFT JOIN messages m ON m.chat_id = c.id
    ${where}
    GROUP BY c.id
    ORDER BY c.pinned DESC, c.created_at DESC, c.id DESC
    ${limitSql}
  `).all(...params, ...(limit ? [limit, offset] : []));

  return {
    rows,
    total,
    limit,
    offset,
    hasMore: limit ? offset + rows.length < total : false,
  };
};

export { listChats };
