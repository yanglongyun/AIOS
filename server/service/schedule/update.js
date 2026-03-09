import { updateScheduleFields } from '../../repository/schedule/update.js';
import { broadcast } from '../../system/ws.js';

export const updateSchedule = ({ id, ...fields }) => {
  const updated = updateScheduleFields({ id, fields });
  if (!updated) return { success: false, message: '没有可更新的字段' };
  broadcast({ type: 'schedules_changed' });
  return { success: true };
};
