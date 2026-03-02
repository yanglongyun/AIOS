import { stopBot } from '../service.js';

export const stopHandler = () => {
  const state = stopBot();
  return { success: true, state };
};
