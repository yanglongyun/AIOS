import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';

export const createSchedule = ({ name, prompt, creator, run_at, cron }) => {
  const row = db.prepare(
    'INSERT INTO schedules (name, prompt, creator, run_at, cron) VALUES (?, ?, ?, ?, ?) RETURNING id'
  ).get(
    name,
    prompt,
    creator || 'user',
    run_at || null,
    cron || null
  );
  broadcast({ type: 'schedules_changed' });
  return { success: true, id: row.id };
};
