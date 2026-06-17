// @ts-nocheck
import { getDb } from "../db.js";

const getMemoryRow = ({ id, userId = "default" }) =>
  getDb().prepare("SELECT * FROM memories WHERE id = ? AND user_id = ?").get(Number(id), userId) || null;

export { getMemoryRow };
