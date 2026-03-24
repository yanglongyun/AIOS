import type { AnyRecord } from '../../../shared/types.ts';
import { saveConfig } from '../repository/config.ts';

export const saveGoal = (body: AnyRecord = {}) => {
  const goal = String(body.goal || '').trim();
  saveConfig({ goal });
  return { success: true };
};
