import { stopBot } from '../runtime/index.js';

export const stop = () => {
  stopBot();
  return { success: true };
};
