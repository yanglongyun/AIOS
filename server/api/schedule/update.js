import { db } from '../../db/client.js';
import { broadcast } from '../../system/ws.js';

export const updateSchedule = ({ id, ...fields }) => {
  const allowed = ['name', 'prompt', 'run_at', 'cron', 'enabled'];
  const sets = [];
  const values = [];
  for (const key of allowed) {
    if (fields[key] === undefined) continue;
    sets.push(`${key} = ?`);
    values.push(fields[key]);
  }
  if (sets.length === 0) return { success: false, message: '没有可更新的字段' };
  values.push(id);
  db.prepare(`UPDATE schedules SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  broadcast({ type: 'schedules_changed' });
  return { success: true };
};
