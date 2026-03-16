import { broadcast } from '../system/ws.js';
import { getTaskStatusById, markTaskAbortedById } from '../repository/task/stop.js';
import { stopTaskExecution } from './execution.js';

export const stopTask = ({ id }) => {
  const task = getTaskStatusById(id);
  if (!task) return { status: 404, message: '任务不存在' };
  if (task.status !== 'pending') return { status: 400, message: '任务不在进行中' };

  const stopped = stopTaskExecution(id);
  markTaskAbortedById(id);
  broadcast({ type: 'tasks_changed' });
  return { success: true, stopped };
};
