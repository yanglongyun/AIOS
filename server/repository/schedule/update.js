import { db } from '../../db/client.js';

const ALLOWED_FIELDS = ['name', 'prompt', 'run_at', 'cron', 'enabled'];

export const updateScheduleFields = ({ id, fields }) => {
  const sets = [];
  const values = [];

  for (const key of ALLOWED_FIELDS) {
    if (fields[key] === undefined) continue;
    sets.push(`${key} = ?`);
    values.push(fields[key]);
  }

  if (sets.length === 0) return false;

  values.push(id);
  db.prepare(`UPDATE schedules SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return true;
};
