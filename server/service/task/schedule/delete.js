import { getTaskScheduleById, deleteTaskScheduleById } from '../../../repository/task/schedule.js';
import { broadcast } from '../../../system/ws.js';

export const deleteSchedule = ({ id }) => {
  const row = getTaskScheduleById(id);
  if (!row) return { status: 404, message: '计划不存在' };
  deleteTaskScheduleById(id);
  broadcast({ type: 'schedules_changed' });
  return { success: true };
};
