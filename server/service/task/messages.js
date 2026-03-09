import { parseJson } from '../../../shared/json/parse.js';
import { listMessagesByConversationId } from '../../repository/task/messages.js';

export const listTaskMessages = ({ conversationId }) => {
  const rows = listMessagesByConversationId(conversationId);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    message: parseJson(row.message, {}),
    meta: parseJson(row.meta, null)
  }));
};
