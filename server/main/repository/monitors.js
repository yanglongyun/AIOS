import { db } from "./client.js";

const normalizeJson = (value) => {
  if (value == null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
};

const insertMonitor = ({
  title = "",
  kind = "task",
  sourceId = null,
  event = "done",
  targetMode = "existing_chat",
  conversationId = null,
  chatTitle = "",
  prompt = "",
  createdByType = "ai",
  createdByRef = null,
}) => {
  const row = db.prepare(
    `INSERT INTO monitors (
      title, kind, source_id, event, target_mode, conversation_id,
      chat_title, prompt, created_by_type, created_by_ref
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).get(
    String(title || ""),
    kind,
    sourceId == null ? null : String(sourceId),
    event,
    targetMode,
    conversationId == null ? null : String(conversationId),
    String(chatTitle || ""),
    String(prompt || ""),
    createdByType,
    createdByRef == null ? null : String(createdByRef)
  );
  return { id: row.id };
};

const listMonitorRows = (limit = 100) => {
  return db.prepare("SELECT * FROM monitors WHERE status != 'deleted' ORDER BY id DESC LIMIT ?").all(limit);
};

const findActiveMonitorRows = ({ kind, sourceId, event }) => {
  return db.prepare(
    "SELECT * FROM monitors WHERE kind = ? AND source_id = ? AND event = ? AND status = 'active' ORDER BY id ASC"
  ).all(kind, sourceId == null ? null : String(sourceId), event);
};

const getMonitorRow = (id) => {
  return db.prepare("SELECT * FROM monitors WHERE id = ? LIMIT 1").get(id) || null;
};

const markMonitorFired = ({ id, conversationId, messageId }) => {
  db.prepare(
    `UPDATE monitors
     SET status = 'fired',
         conversation_id = COALESCE(?, conversation_id),
         delivered_message_id = ?,
         error = NULL,
         fired_at = datetime('now')
     WHERE id = ?`
  ).run(conversationId || null, messageId || null, id);
};

const markMonitorError = ({ id, error }) => {
  db.prepare(
    "UPDATE monitors SET error = ?, fired_at = datetime('now') WHERE id = ?"
  ).run(String(error || "监视器投递失败"), id);
};

const updateMonitorStatus = ({ id, status }) => {
  db.prepare("UPDATE monitors SET status = ? WHERE id = ?").run(status, id);
};

export {
  findActiveMonitorRows,
  getMonitorRow,
  insertMonitor,
  listMonitorRows,
  markMonitorError,
  markMonitorFired,
  normalizeJson,
  updateMonitorStatus,
};
