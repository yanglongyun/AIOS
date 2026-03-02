import { saveConfig } from '../service.js';

export const saveConfigHandler = (body = {}) => {
  const status = saveConfig(body);
  return { success: true, ...status };
};
