import { db } from '../../db/client.js';

export const listSchedulesByLimit = (limit) => {
  return db.prepare('SELECT * FROM schedules ORDER BY id DESC LIMIT ?').all(limit);
};
