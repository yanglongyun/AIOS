import { getBotStatus } from '../service.js';

export const getStatusHandler = () => {
  return { success: true, ...getBotStatus() };
};
