import { getTaskScheduleById, deleteTaskScheduleById } from "../../repository/task/schedule.js";
import { broadcast } from "../../system/ws.js";
const deleteSchedule = ({ id }) => {
  const row = getTaskScheduleById(id);
  if (!row) return { status: 404, message: "\u8BA1\u5212\u4E0D\u5B58\u5728" };
  deleteTaskScheduleById(id);
  broadcast({ type: "schedules_changed" });
  return { success: true };
};
export {
  deleteSchedule
};
