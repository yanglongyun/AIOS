// @ts-nocheck
import { getDb } from "../db.js";

const countMemoryRows = ({ userId = "default", visibility = "" } = {}) => {
  if (visibility) {
    return Number(getDb().prepare("SELECT COUNT(*) AS count FROM memories WHERE user_id = ? AND visibility = ?").get(userId, visibility)?.count || 0);
  }
  return Number(getDb().prepare("SELECT COUNT(*) AS count FROM memories WHERE user_id = ?").get(userId)?.count || 0);
};

export { countMemoryRows };
