// @ts-nocheck
import { getDb } from "../db.js";

const listMemoryRows = ({ userId = "default", visibility = "", limit = 200 } = {}) => {
  const size = Math.max(1, Math.min(500, Number(limit) || 200));
  if (visibility) {
    return getDb()
      .prepare("SELECT * FROM memories WHERE user_id = ? AND visibility = ? ORDER BY id DESC LIMIT ?")
      .all(userId, visibility, size);
  }
  return getDb()
    .prepare("SELECT * FROM memories WHERE user_id = ? ORDER BY id DESC LIMIT ?")
    .all(userId, size);
};

export { listMemoryRows };
