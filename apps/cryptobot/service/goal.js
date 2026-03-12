import { saveConfig } from '../repository/config.js';

export const saveGoal = (body = {}) => {
  const goal = String(body.goal || '').trim();
  saveConfig({ goal });
  return { success: true };
};
