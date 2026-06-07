// @ts-nocheck
import { getDb } from "../db.js";

const createTaskRow = ({ chatId, name, prompt }) => {
  const row = getDb()
    .prepare(
      `INSERT INTO tasks (chat_id, name, prompt, status)
       VALUES (?, ?, ?, 'pending')
       RETURNING id`
    )
    .get(chatId, name, prompt);
  return row.id;
};

export { createTaskRow };
