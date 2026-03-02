import { startBot } from '../schedule/index.js';

export const startHandler = (body = {}) => {
  startBot(body.interval_sec);
  return { success: true };
};
