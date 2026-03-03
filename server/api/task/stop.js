import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';
import { stopTaskExecution } from './create.js';

export const stopTask = ({ id }) => {
  const task = db.prepare('SELECT id, status FROM tasks WHERE id = ? LIMIT 1').get(id);
  if (!task) return { status: 404, message: '任务不存在' };
  if (task.status !== 'pending') return { status: 400, message: '任务不在进行中' };

  const stopped = stopTaskExecution(id);

  db.prepare(
    "UPDATE tasks SET status = 'aborted', error = '用户终止任务', finished_at = datetime('now') WHERE id = ?"
  ).run(id);
  broadcast({ type: 'tasks_changed' });
  return { success: true, stopped };
};
