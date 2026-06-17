// @ts-nocheck
import { getTask, markTaskAborted } from "../../repository/tasks/index.js";
import { getTaskExecution } from "./execution.js";

const abortTask = (taskId) => {
  const task = getTask(taskId);
  if (!task) throw new Error("task not found");
  if (["done", "error", "aborted"].includes(task.status)) return task;
  const controller = getTaskExecution(taskId);
  if (controller) controller.abort();
  markTaskAborted(taskId);
  return getTask(taskId);
};

export { abortTask };
