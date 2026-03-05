import { db } from '../../db/client.js';
import { parseJson } from '../../../shared/json/parse.js';

export const listTaskMessages = ({ conversationId }) => {
  const rows = db.prepare(
    'SELECT id, message, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC'
  ).all(conversationId);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    message: parseJson(row.message, {}),
    meta: parseJson(row.meta, null)
  }));
};
