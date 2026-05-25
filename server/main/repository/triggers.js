import { db } from "./client.js";

const normalizeJson = (value) => {
  if (value == null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
};

const insertTrigger = ({
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
    `INSERT INTO triggers (
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

const listTriggerRows = (limit = 100) => {
  return db.prepare("SELECT * FROM triggers WHERE status != 'deleted' ORDER BY id DESC LIMIT ?").all(limit);
};

const findActiveTriggerRows = ({ kind, sourceId, event }) => {
  return db.prepare(
    "SELECT * FROM triggers WHERE kind = ? AND source_id = ? AND event = ? AND status = 'active' ORDER BY id ASC"
  ).all(kind, sourceId == null ? null : String(sourceId), event);
};

const getTriggerRow = (id) => {
  return db.prepare("SELECT * FROM triggers WHERE id = ? LIMIT 1").get(id) || null;
};

const markTriggerFired = ({ id, conversationId, messageId }) => {
  db.prepare(
    `UPDATE triggers
     SET status = 'fired',
         conversation_id = COALESCE(?, conversation_id),
         delivered_message_id = ?,
         error = NULL,
         fired_at = datetime('now')
     WHERE id = ?`
  ).run(conversationId || null, messageId || null, id);
};

const markTriggerError = ({ id, error }) => {
  db.prepare(
    "UPDATE triggers SET error = ?, fired_at = datetime('now') WHERE id = ?"
  ).run(String(error || "触发器投递失败"), id);
};

const updateTriggerStatus = ({ id, status }) => {
  db.prepare("UPDATE triggers SET status = ? WHERE id = ?").run(status, id);
};

export {
  findActiveTriggerRows,
  getTriggerRow,
  insertTrigger,
  listTriggerRows,
  markTriggerError,
  markTriggerFired,
  normalizeJson,
  updateTriggerStatus,
};
