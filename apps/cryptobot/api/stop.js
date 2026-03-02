import { stopBot } from '../schedule/index.js';

export const stopHandler = () => {
  stopBot();
  return { success: true };
};
