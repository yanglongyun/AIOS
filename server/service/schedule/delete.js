import { deleteScheduleById } from '../../repository/schedule/delete.js';
import { broadcast } from '../../system/ws.js';

export const deleteSchedule = ({ id }) => {
  deleteScheduleById(id);
  broadcast({ type: 'schedules_changed' });
  return { success: true };
};
