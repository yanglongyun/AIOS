import { getTaskScheduleById, updateTaskScheduleById } from "../../repository/task/schedule.js";
import { broadcast } from "../../system/ws.js";
const normalizeRunAt = (value) => {
  if (value === void 0) return void 0;
  const raw = String(value || "").trim();
  if (!raw) return null;
  return raw.replace("T", " ").slice(0, 19);
};
const normalizeCron = (value) => {
  if (value === void 0) return void 0;
  const raw = String(value || "").trim();
  return raw || null;
};
const updateSchedule = ({ id, name, prompt, run_at, cron, enabled }) => {
  const row = getTaskScheduleById(id);
  if (!row) return { status: 404, message: "计划不存在" };
  const patch = {};
  if (name !== void 0) patch.name = String(name || "").trim();
  if (prompt !== void 0) patch.prompt = String(prompt || "").trim();
  if (run_at !== void 0) patch.run_at = normalizeRunAt(run_at);
  if (cron !== void 0) patch.cron = normalizeCron(cron);
  if (enabled !== void 0) patch.enabled = Number(enabled) ? 1 : 0;
  const runAt = patch.run_at !== void 0 ? patch.run_at : row.run_at;
  const cronExpr = patch.cron !== void 0 ? patch.cron : row.cron;
  if (!runAt && !cronExpr) return { status: 400, message: "run_at 或 cron 必须提供一个" };
  if (runAt && cronExpr) return { status: 400, message: "run_at 与 cron 不能同时提供" };
  const next = updateTaskScheduleById({ id, patch });
  broadcast({ type: "schedules_changed" });
  return { success: true, schedule: next };
};
export {
  updateSchedule
};
