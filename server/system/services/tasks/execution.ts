// @ts-nocheck
const running = new Map();

const registerTaskExecution = (taskId, abortController) => {
  running.set(String(taskId), abortController);
};

const unregisterTaskExecution = (taskId) => {
  running.delete(String(taskId));
};

const getTaskExecution = (taskId) => running.get(String(taskId));

export { getTaskExecution, registerTaskExecution, running, unregisterTaskExecution };
