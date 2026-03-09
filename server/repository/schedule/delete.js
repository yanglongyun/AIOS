import { db } from '../../db/client.js';

export const deleteScheduleById = (id) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(id);
};
