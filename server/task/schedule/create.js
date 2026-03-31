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
  if (!n) throw new Error("name 不能为空");
  if (!p) throw new Error("prompt 不能为空");
  if (!r && !c) throw new Error("run_at 或 cron 必须提供一个");
  if (r && c) throw new Error("run_at 与 cron 不能同时提供");
  const id = insertTaskSchedule({ name: n, prompt: p, run_at: r, cron: c });
  broadcast({ type: "schedules_changed" });
  return { success: true, id, schedule: getTaskScheduleById(id) };
};
export {
  createSchedule
};
