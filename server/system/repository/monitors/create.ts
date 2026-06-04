// @ts-nocheck
import { getDb } from "../db.js";

const INSERT_SQL = `
  INSERT INTO monitors (
    title, status, kind, source_id, event,
    target_mode, conversation_id, chat_title, prompt,
    created_by_type, created_by_ref
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING id
`;

const insertMonitorRow = (monitor) => {
  const row = getDb().prepare(INSERT_SQL).get(
    monitor.title ?? null,
    monitor.status || "active",
    monitor.kind || "task",
    monitor.sourceId != null ? String(monitor.sourceId) : null,
    monitor.event || "done",
    monitor.targetMode || "existing_chat",
    monitor.conversationId ?? null,
    monitor.chatTitle ?? null,
    monitor.prompt ?? null,
    monitor.createdByType ?? null,
    monitor.createdByRef ?? null
  );
  return row.id;
};

export { insertMonitorRow };
