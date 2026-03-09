import { handleTaskCreateInstantApi } from './instant.js';
import { handleTaskCreateAgentApi } from './agent.js';
import { stopTaskExecution } from '../../../runtime/task/control.js';

export const handleTaskCreateApi = async (req, res, path) => {
  if (path.startsWith('/api/task/create/instant')) {
    return await handleTaskCreateInstantApi(req, res, path);
  }
  if (path.startsWith('/api/task/create/agent')) {
    return await handleTaskCreateAgentApi(req, res, path);
  }
  return false;
};
