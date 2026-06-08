// @ts-nocheck
import { getDb } from "../db.js";

const createTaskRow = ({ name, prompt }) => {
  const row = getDb()
    .prepare(
      `INSERT INTO tasks (name, prompt, status)
       VALUES (?, ?, 'pending')
       RETURNING id`
    )
    .get(name, prompt);
  return row.id;
};

export { createTaskRow };
