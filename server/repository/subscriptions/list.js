// @ts-nocheck
import { getDb } from "../db.js";

const listActiveSubscriptionsByTask = (taskId) =>
  getDb()
    .prepare(
      `SELECT id, task_id, chat_id, status, created_at, fired_at
       FROM subscriptions
       WHERE task_id = ? AND status = 'active'
       ORDER BY id ASC`,
    )
    .all(Number(taskId));

const listSubscriptions = ({ limit = 200 } = {}) =>
  getDb()
    .prepare(
      `SELECT id, task_id, chat_id, status, created_at, fired_at
       FROM subscriptions
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(Math.max(1, Math.min(500, Number(limit) || 200)));

export { listActiveSubscriptionsByTask, listSubscriptions };
