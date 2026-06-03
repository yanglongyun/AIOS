import {
  insertChatMessageRow,
  listRecentChatMessageRows
} from "../../repository/chat/messages.js";
import { normalizeContextRounds } from "../settings/get.js";

const getMessages = (conversationId, messageLimit = 100) => {
  const limit = normalizeContextRounds(messageLimit);
  const rows = listRecentChatMessageRows(conversationId, limit);
  return rows.reverse().map((r) => ({
    ...JSON.parse(r.message),
    _id: r.id,
    _meta: r.meta ? JSON.parse(r.meta) : null
  }));
};
const saveMessage = (conversationId, msg, meta = null, remark = null) => {
  const result = insertChatMessageRow(
    conversationId,
    JSON.stringify(msg),
    meta ? JSON.stringify(meta) : null,
    remark
  );
  return { id: Number(result.lastInsertRowid) };
};
export {
  getMessages,
  saveMessage
};
