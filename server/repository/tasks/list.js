// @ts-nocheck
import { getDb } from "../db.js";

const listTasks = ({ limit = 100 } = {}) =>
  getDb()
    .prepare("SELECT * FROM tasks ORDER BY id DESC LIMIT ?")
    .all(Math.max(1, Math.min(500, Number(limit) || 100)));

export { listTasks };
