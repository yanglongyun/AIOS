import { listTriggerRows } from "../../repository/triggers.js";

const parseRow = (row) => ({
  id: row.id,
  title: row.title || "",
  status: row.status,
  kind: row.kind,
  sourceId: row.source_id,
  event: row.event,
  targetMode: row.target_mode,
  conversationId: row.conversation_id,
  chatTitle: row.chat_title || "",
  prompt: row.prompt || "",
  createdByType: row.created_by_type,
  createdByRef: row.created_by_ref,
  deliveredMessageId: row.delivered_message_id,
  error: row.error,
  createdAt: row.created_at,
  firedAt: row.fired_at,
});

const listTriggers = ({ limit = 100 } = {}) => {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  return listTriggerRows(safeLimit).map(parseRow);
};

export {
  listTriggers,
  parseRow,
};
