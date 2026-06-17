// @ts-nocheck
import { getDb } from "../db.js";

const searchMemoryRows = ({ userId = "default", query = "", limit = 20 } = {}) => {
  const q = String(query || "").trim();
  const size = Math.max(1, Math.min(100, Number(limit) || 20));
  if (!q) {
    return getDb()
      .prepare("SELECT id, user_id, title, description, visibility, created_at, updated_at FROM memories WHERE user_id = ? ORDER BY id DESC LIMIT ?")
      .all(userId, size);
  }
  const like = `%${q}%`;
  return getDb()
    .prepare(
      `SELECT id, user_id, title, description, visibility, created_at, updated_at
       FROM memories
       WHERE user_id = ? AND (title LIKE ? OR description LIKE ? OR body LIKE ?)
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(userId, like, like, like, size);
};

export { searchMemoryRows };
