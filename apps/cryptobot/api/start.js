import { startBot } from '../runtime/index.js';

export const startHandler = (body = {}) => {
  startBot(body.interval_sec);
  return { success: true };
};
