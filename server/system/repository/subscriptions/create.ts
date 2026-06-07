// @ts-nocheck
import { getDb } from "../db.js";

const createSubscriptionRow = ({ taskId, chatId }) => {
  const row = getDb()
    .prepare(
      `INSERT INTO subscriptions (task_id, chat_id, status)
       VALUES (?, ?, 'active')
       RETURNING id`,
    )
    .get(taskId, String(chatId || "").trim());
  return row.id;
};

export { createSubscriptionRow };
