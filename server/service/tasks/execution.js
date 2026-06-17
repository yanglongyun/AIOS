// @ts-nocheck
const runningTasks = new Map();

const registerTaskExecution = (taskId, controller) => {
  runningTasks.set(String(taskId), controller);
};

const unregisterTaskExecution = (taskId) => {
  runningTasks.delete(String(taskId));
};

const getTaskExecution = (taskId) => runningTasks.get(String(taskId));

export { getTaskExecution, registerTaskExecution, unregisterTaskExecution };
