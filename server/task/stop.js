import { broadcast } from "../system/ws.js";
import { getTaskStatusById, markTaskAbortedById } from "../repository/task/stop.js";
import { stopTaskExecution } from "./execution.js";
const stopTask = ({ id }) => {
  const task = getTaskStatusById(id);
  if (!task) return { status: 404, message: "\u4EFB\u52A1\u4E0D\u5B58\u5728" };
  if (task.status !== "pending") return { status: 400, message: "\u4EFB\u52A1\u4E0D\u5728\u8FDB\u884C\u4E2D" };
  const stopped = stopTaskExecution(id);
  markTaskAbortedById(id);
  broadcast({ type: "tasks_changed" });
  return { success: true, stopped };
};
export {
  stopTask
};
