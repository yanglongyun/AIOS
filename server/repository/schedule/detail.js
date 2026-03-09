import { db } from '../../db/client.js';

export const getScheduleById = (id) => {
  return db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) || null;
};
