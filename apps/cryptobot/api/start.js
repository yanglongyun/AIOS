import { startBot } from '../schedule.js';

export const startHandler = (body = {}) => {
  startBot(body.interval_sec);
  return { success: true };
};
