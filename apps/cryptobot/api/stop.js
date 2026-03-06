import { stopBot } from '../runtime/index.js';

export const stopHandler = () => {
  stopBot();
  return { success: true };
};
