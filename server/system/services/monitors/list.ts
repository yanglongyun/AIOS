// @ts-nocheck
import { listMonitorRows } from "../../repository/monitors/index.js";

const toMonitor = (row) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  kind: row.kind,
  sourceId: row.source_id,
  event: row.event,
  targetMode: row.target_mode,
  conversationId: row.conversation_id,
  chatTitle: row.chat_title,
  prompt: row.prompt,
  createdByType: row.created_by_type,
  createdByRef: row.created_by_ref,
  deliveredMessageId: row.delivered_message_id,
  error: row.error,
  createdAt: row.created_at,
  firedAt: row.fired_at,
});

const listMonitors = ({ status, conversationId } = {}) =>
  listMonitorRows({ status, conversationId }).map(toMonitor);

export { listMonitors };
