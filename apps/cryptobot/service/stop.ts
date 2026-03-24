import { stopBot } from '../runtime/index.ts';

export const stop = () => {
  stopBot();
  return { success: true };
};
