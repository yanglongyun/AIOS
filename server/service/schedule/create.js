import { createScheduleRow } from '../../repository/schedule/create.js';
import { broadcast } from '../../system/ws.js';

export const createSchedule = ({ name, prompt, creator, run_at, cron } = {}) => {
  const row = createScheduleRow({ name, prompt, creator, run_at, cron });
  broadcast({ type: 'schedules_changed' });
  return { success: true, id: row.id };
};
