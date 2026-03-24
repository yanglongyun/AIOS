import { db } from '../client.ts';

export const getTaskStatusById = (id) => {
  return db.prepare('SELECT id, status FROM tasks WHERE id = ? LIMIT 1').get(id) || null;
};

export const markTaskAbortedById = (id) => {
  db.prepare(
    "UPDATE tasks SET status = 'aborted', error = '用户终止任务', finished_at = datetime('now') WHERE id = ?"
  ).run(id);
};
