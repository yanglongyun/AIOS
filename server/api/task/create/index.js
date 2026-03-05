import { handleTaskCreateInstantApi, stopInstantTaskExecution } from './instant.js';
import { handleTaskCreateAgentApi, stopAgentTaskExecution } from './agent.js';

export const stopTaskExecution = (taskId) => {
  return stopInstantTaskExecution(taskId) || stopAgentTaskExecution(taskId);
};

export const handleTaskCreateApi = async (req, res, path) => {
  if (path.startsWith('/api/task/create/instant')) {
    return await handleTaskCreateInstantApi(req, res, path);
  }
  if (path.startsWith('/api/task/create/agent')) {
    return await handleTaskCreateAgentApi(req, res, path);
  }
  return false;
};
