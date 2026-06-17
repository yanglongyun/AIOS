// @ts-nocheck
import { getDb } from "../db.js";

const markTaskRunning = (id) => {
  getDb().prepare("UPDATE tasks SET status = 'running' WHERE id = ?").run(Number(id));
};

const markTaskDone = (id, response) => {
  getDb()
    .prepare("UPDATE tasks SET status = 'done', response = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(String(response || ""), Number(id));
};

const markTaskError = (id, error) => {
  getDb()
    .prepare("UPDATE tasks SET status = 'error', error = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(String(error || ""), Number(id));
};

const markTaskAborted = (id) => {
  getDb().prepare("UPDATE tasks SET status = 'aborted', finished_at = CURRENT_TIMESTAMP WHERE id = ?").run(Number(id));
};

export { markTaskAborted, markTaskDone, markTaskError, markTaskRunning };
