import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';

export const deleteSchedule = (id) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
  broadcast({ type: 'schedules_changed' });
  return { success: true };
};
