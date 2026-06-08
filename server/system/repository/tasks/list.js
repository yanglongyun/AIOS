// @ts-nocheck
import { getDb } from "../db.js";

const listTasks = ({ limit = 50 } = {}) =>
  getDb().prepare("SELECT * FROM tasks ORDER BY id DESC LIMIT ?").all(limit);

export { listTasks };
