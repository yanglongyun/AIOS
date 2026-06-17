// @ts-nocheck
import { getDb } from "../../db.js";

const listMessages = (options = {}) => {
  const chatId = String(options.chatId || "").trim();
  const limit = Math.max(1, Math.floor(Number(options.limit || 50)));
  const offset = Math.max(0, Math.floor(Number(options.offset || 0)));
  const recent = !!options.recent;
  const normalizedOrder = recent || String(options.order || "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
  const db = getDb();
  const total = Number(db.prepare("SELECT COUNT(*) AS count FROM messages WHERE chat_id = ?").get(chatId)?.count) || 0;
  const rows = db.prepare(`
    SELECT id, chat_id, message, meta, usage, created_at
    FROM messages
    WHERE chat_id = ?
    ORDER BY id ${normalizedOrder}
    LIMIT ? OFFSET ?
  `).all(chatId, limit, offset);
  const messages = rows.map((row) => ({
    id: row.id,
    chat_id: row.chat_id,
    message: JSON.parse(row.message),
    meta: row.meta ? JSON.parse(row.meta) : null,
    usage: row.usage ? JSON.parse(row.usage) : null,
    created_at: row.created_at,
  }));
  if (recent) messages.reverse();
  return { messages, total, offset, limit, hasMore: offset + rows.length < total };
};

export { listMessages };
