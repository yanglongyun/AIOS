const runningTaskControllers = new Map();

export const registerTaskExecution = (taskId, abortController) => {
  if (!taskId || !abortController) return;
  runningTaskControllers.set(taskId, abortController);
};

export const unregisterTaskExecution = (taskId) => {
  if (!taskId) return;
  runningTaskControllers.delete(taskId);
};

export const stopTaskExecution = (taskId) => {
  const controller = runningTaskControllers.get(taskId);
  if (!controller) return false;
  controller.abort();
  return true;
};
