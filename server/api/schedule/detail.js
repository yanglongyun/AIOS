import { db } from '../../db/client.js';

export const getScheduleDetail = (id) => {
  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
};
