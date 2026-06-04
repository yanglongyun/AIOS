// @ts-nocheck
import { getDb } from "../db.js";

const markMonitorFired = ({ id, conversationId, messageId }) => {
  getDb().prepare(`
    UPDATE monitors
    SET status = 'fired',
        conversation_id = COALESCE(?, conversation_id),
        delivered_message_id = ?,
        fired_at = CURRENT_TIMESTAMP,
        error = NULL
    WHERE id = ?
  `).run(conversationId ?? null, messageId ?? null, Number(id));
};

const markMonitorError = ({ id, error }) => {
  getDb().prepare("UPDATE monitors SET error = ? WHERE id = ?")
    .run(String(error || "unknown error"), Number(id));
};

const updateMonitorStatus = (id, status) => {
  getDb().prepare("UPDATE monitors SET status = ? WHERE id = ?")
    .run(String(status), Number(id));
};

export { markMonitorFired, markMonitorError, updateMonitorStatus };
