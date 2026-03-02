import { stopBot } from '../schedule.js';

export const stopHandler = () => {
  stopBot();
  return { success: true };
};
