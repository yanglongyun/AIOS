import { getEnabledTaskSchedules, updateTaskScheduleById } from "../../repository/task/schedule.js";
import { createAgentTask } from "../create/agent.js";
import { shouldRunCron } from "./cron.js";
import { broadcast } from "../../system/ws.js";
let timer = null;
const nowSql = (now = /* @__PURE__ */ new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};
const shouldRunSchedule = (schedule, now, nowStr) => {
  if (!Number(schedule.enabled)) return false;
  if (schedule.cron) {
    if (!shouldRunCron(schedule.cron, now)) return false;
    const lastMin = String(schedule.last_run_at || "").slice(0, 16);
    const nowMin = nowStr.slice(0, 16);
    return lastMin !== nowMin;
  }
  if (!schedule.run_at) return false;
  if (schedule.last_run_at) return false;
  return String(schedule.run_at) <= nowStr;
};
const tick = async () => {
  const now = /* @__PURE__ */ new Date();
  const nowStr = nowSql(now);
  const schedules = getEnabledTaskSchedules();
  for (const s of schedules) {
    if (!shouldRunSchedule(s, now, nowStr)) continue;
    try {
      const result = await createAgentTask({
        app: "tasks",
        title: s.name,
        prompt: s.prompt,
        schedule_id: String(s.id)
      });
      const patch = {
        last_run_at: nowStr,
        last_task_id: Number(result?.id || 0) || null
      };
      if (!s.cron) patch.enabled = 0;
      updateTaskScheduleById({ id: s.id, patch });
      broadcast({ type: "schedules_changed" });
    } catch (e) {
      console.error("[task-scheduler]", e?.message || e);
    }
  }
};
const startTaskScheduler = () => {
  if (timer) return;
  timer = setInterval(tick, 6e4);
  setTimeout(() => tick().catch(() => {
  }), 3e3);
};
const stopTaskScheduler = () => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};
export {
  startTaskScheduler,
  stopTaskScheduler
};
