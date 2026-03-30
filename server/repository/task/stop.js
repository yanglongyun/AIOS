import { db } from "../client.js";
const getTaskStatusById = (id) => {
  return db.prepare("SELECT id, status FROM tasks WHERE id = ? LIMIT 1").get(id) || null;
};
const markTaskAbortedById = (id) => {
  db.prepare(
    "UPDATE tasks SET status = 'aborted', error = '\u7528\u6237\u7EC8\u6B62\u4EFB\u52A1', finished_at = datetime('now') WHERE id = ?"
  ).run(id);
};
export {
  getTaskStatusById,
  markTaskAbortedById
};
