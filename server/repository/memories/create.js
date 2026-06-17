// @ts-nocheck
import { getDb } from "../db.js";

const createMemoryRow = ({ userId = "default", title, description = "", body = "", visibility = "stored" }) =>
  getDb()
    .prepare(
      `INSERT INTO memories (user_id, title, description, body, visibility)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .get(userId, title, description, body, visibility);

export { createMemoryRow };
