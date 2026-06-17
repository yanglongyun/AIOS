// @ts-nocheck
import { getDb } from "../db.js";

const createTaskRow = ({ name, prompt }) => {
  const row = getDb()
    .prepare(
      `INSERT INTO tasks (name, prompt, status)
       VALUES (?, ?, 'pending')
       RETURNING id`,
    )
    .get(String(name || "").trim(), String(prompt || ""));
  return Number(row.id);
};

export { createTaskRow };
