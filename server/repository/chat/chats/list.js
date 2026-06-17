// @ts-nocheck
import { getDb } from "../../db.js";

const listChats = ({ app = "chat" } = {}) => {
  const chatApp = String(app || "chat").trim() || "chat";
  const rows = getDb().prepare(`
    SELECT c.*, COUNT(m.id) AS message_count, MAX(m.created_at) AS updated_at
    FROM chats c
    LEFT JOIN messages m ON m.chat_id = c.id
    WHERE c.app = ?
    GROUP BY c.id
    ORDER BY c.pinned DESC, COALESCE(MAX(m.id), 0) DESC, c.created_at DESC
  `).all(chatApp);
  return rows.map((row) => ({
    ...row,
    meta: row.meta ? JSON.parse(row.meta) : null,
    updated_at: row.updated_at || row.created_at,
  }));
};

export { listChats };
