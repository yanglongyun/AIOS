import { db } from '../db/client.js';
import { createAgentTask } from '../api/task/create/agent.js';
import { broadcast } from '../system/ws.js';
import { shouldRunCron } from './cron.js';

let timer = null;

const nowIso = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const tick = async () => {
  const now = new Date();
  const iso = nowIso();
  const schedules = db.prepare('SELECT * FROM schedules WHERE enabled = 1').all();

  for (const s of schedules) {
    let shouldRun = false;

    if (s.cron) {
      if (shouldRunCron(s.cron, now)) {
        const lastMin = (s.last_run_at || '').slice(0, 16);
        const nowMin = iso.slice(0, 16);
        if (lastMin !== nowMin) shouldRun = true;
      }
    } else if (s.run_at) {
      if (s.run_at <= iso && !s.last_run_at) shouldRun = true;
    } else {
      if (!s.last_run_at) shouldRun = true;
    }

    if (!shouldRun) continue;

    try {
      const result = await createAgentTask({
        app: 'scheduler',
        title: s.name,
        prompt: s.prompt
      });

      db.prepare('UPDATE schedules SET last_run_at = ?, last_task_id = ? WHERE id = ?')
        .run(iso, result.id, s.id);

      if (!s.cron) {
        db.prepare('UPDATE schedules SET enabled = 0 WHERE id = ?').run(s.id);
      }

      broadcast({ type: 'schedules_changed' });
    } catch (e) {
      db.prepare('UPDATE schedules SET last_run_at = ? WHERE id = ?').run(iso, s.id);

      if (!s.cron) {
        db.prepare('UPDATE schedules SET enabled = 0 WHERE id = ?').run(s.id);
      }

      broadcast({ type: 'schedules_changed' });
      console.error(`[scheduler] #${s.id} failed:`, e.message);
    }
  }
};

export const startScheduler = () => {
  if (timer) return;
  timer = setInterval(tick, 60_000);
  setTimeout(tick, 5000);
};

export const stopScheduler = () => {
  if (timer) { clearInterval(timer); timer = null; }
};
