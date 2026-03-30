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
  if (!n) throw new Error("name \u4E0D\u80FD\u4E3A\u7A7A");
  if (!p) throw new Error("prompt \u4E0D\u80FD\u4E3A\u7A7A");
  if (!r && !c) throw new Error("run_at \u6216 cron \u5FC5\u987B\u63D0\u4F9B\u4E00\u4E2A");
  if (r && c) throw new Error("run_at \u4E0E cron \u4E0D\u80FD\u540C\u65F6\u63D0\u4F9B");
  const id = insertTaskSchedule({ name: n, prompt: p, run_at: r, cron: c });
  broadcast({ type: "schedules_changed" });
  return { success: true, id, schedule: getTaskScheduleById(id) };
};
export {
  createSchedule
};
