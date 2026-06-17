// @ts-nocheck
import { getDb } from "../db.js";

const updateMemoryRow = ({ id, userId = "default", title, description, body, visibility }) =>
  getDb()
    .prepare(
      `UPDATE memories
       SET title = ?, description = ?, body = ?, visibility = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?
       RETURNING *`,
    )
    .get(title, description, body, visibility, Number(id), userId) || null;

export { updateMemoryRow };
