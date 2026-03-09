import { stopInstantTaskExecution } from '../../api/task/create/instant.js';
import { stopAgentTaskExecution } from '../../api/task/create/agent.js';

export const stopTaskExecution = (taskId) => {
  return stopInstantTaskExecution(taskId) || stopAgentTaskExecution(taskId);
};
