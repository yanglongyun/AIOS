import { db } from '../../db/client.js';

export const listSchedules = (limit = 50) => {
  return db.prepare('SELECT * FROM schedules ORDER BY id DESC LIMIT ?').all(limit);
};
