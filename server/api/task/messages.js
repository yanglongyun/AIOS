import { db } from '../../db/client.js';

const parseJSON = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const listTaskMessages = ({ sessionId }) => {
  const rows = db.prepare(
    'SELECT id, message, meta, created_at FROM messages WHERE session_id = ? ORDER BY id ASC'
  ).all(sessionId);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    message: parseJSON(row.message, {}),
    meta: parseJSON(row.meta, null)
  }));
};

