// @ts-nocheck
import { getDb } from "../../db.js";

const searchChats = (options = {}) => {
  const db = getDb();
  const query = String(options.query || "").trim();
  if (!query) {
    return { chats: [], total: 0, limit: null, offset: 0, hasMore: false };
  }

  const scene = options.scene ? String(options.scene) : null;
  const limit = Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
    ? Math.floor(Number(options.limit))
    : null;
  const offset = Math.max(0, Math.floor(Number(options.offset || 0)));
  const filters = [`
    (
      c.title LIKE ?
      OR c.description LIKE ?
      OR EXISTS (
        SELECT 1 FROM messages sm
        WHERE sm.chat_id = c.id
          AND sm.message LIKE ?
      )
    )
  `];
  const like = `%${query}%`;
  const params = [like, like, like];

  if (scene) {
    filters.push("c.scene = ?");
    params.push(scene);
  }

  const where = `WHERE ${filters.join(" AND ")}`;
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

export { searchChats };
