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
    .all(taskId);

export { listActiveSubscriptionsByTask };
