import { insertTaskSchedule, getTaskScheduleById } from "../../repository/task/schedule.js";
import { broadcast } from "../../system/ws.js";
const normalizeRunAt = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return raw.replace("T", " ").slice(0, 19);
};
const createSchedule = ({ name, prompt, run_at = null, cron = null }) => {
  const n = String(name || "").trim();
  const p = String(prompt || "").trim();
  const r = normalizeRunAt(run_at);
  const c = String(cron || "").trim() || null;
  if (!n) throw new Error("name is required");
  if (!p) throw new Error("prompt is required");
  if (!r && !c) throw new Error("Either run_at or cron is required");
  if (r && c) throw new Error("run_at and cron cannot be provided together");
  const id = insertTaskSchedule({ name: n, prompt: p, run_at: r, cron: c });
  broadcast({ type: "schedules_changed" });
  return { success: true, id, schedule: getTaskScheduleById(id) };
};
export {
  createSchedule
};
