import { db } from '../client.ts';

export const listTaskSchedules = (limit = 200) => {
  const size = Math.max(1, Math.min(1000, Number(limit) || 200));
  return db.prepare(`
    SELECT id, name, prompt, run_at, cron, enabled, last_run_at, last_task_id, created_at, updated_at
    FROM schedules
    ORDER BY id DESC
    LIMIT ?
  `).all(size);
};

export const getEnabledTaskSchedules = () => {
  return db.prepare(`
    SELECT id, name, prompt, run_at, cron, enabled, last_run_at, last_task_id, created_at, updated_at
    FROM schedules
    WHERE enabled = 1
    ORDER BY id ASC
  `).all();
};

export const getTaskScheduleById = (id) => {
  return db.prepare(`
    SELECT id, name, prompt, run_at, cron, enabled, last_run_at, last_task_id, created_at, updated_at
    FROM schedules
    WHERE id = ?
  `).get(Number(id || 0));
};

export const insertTaskSchedule = ({ name, prompt, run_at = null, cron = null }) => {
  const row = db.prepare(`
    INSERT INTO schedules (name, prompt, run_at, cron, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    RETURNING id
  `).get(String(name || ''), String(prompt || ''), run_at || null, cron || null);
  return Number(row?.id || 0);
};

export const updateTaskScheduleById = ({ id, patch = {} }) => {
  const current = getTaskScheduleById(id);
  if (!current) return null;
  const next = { ...current, ...patch };
  db.prepare(`
    UPDATE schedules
    SET name = ?, prompt = ?, run_at = ?, cron = ?, enabled = ?,
        last_run_at = ?, last_task_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    String(next.name || ''),
    String(next.prompt || ''),
    next.run_at || null,
    next.cron || null,
    next.enabled ? 1 : 0,
    next.last_run_at || null,
    Number(next.last_task_id || 0) || null,
    Number(id || 0)
  );
  return getTaskScheduleById(id);
};

export const deleteTaskScheduleById = (id) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(Number(id || 0));
};
