// @ts-nocheck
import { getDb } from "../db.js";

const removeMemoryRow = ({ id, userId = "default" }) =>
  getDb().prepare("DELETE FROM memories WHERE id = ? AND user_id = ?").run(Number(id), userId).changes > 0;

export { removeMemoryRow };
