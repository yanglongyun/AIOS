import { db } from '../../db/client.js';

export const createScheduleRow = ({ name, prompt, creator, run_at, cron }) => {
  return db.prepare(
    'INSERT INTO schedules (name, prompt, creator, run_at, cron) VALUES (?, ?, ?, ?, ?) RETURNING id'
  ).get(name, prompt, creator || 'user', run_at || null, cron || null);
};
