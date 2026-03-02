import { forceRefreshStrategy } from '../service.js';

export const refreshStrategyHandler = async () => {
  const status = await forceRefreshStrategy();
  return { success: true, ...status };
};
