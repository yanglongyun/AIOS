import { saveConfig, startBot } from '../service.js';

export const startHandler = (body = {}) => {
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    saveConfig(body);
  }
  const state = startBot();
  return { success: true, state };
};
