import type { AnyRecord } from '../../../shared/types.ts';
import { getConfig, saveConfig } from '../repository/config.ts';
import { fetchAccountTotalEq } from '../runtime/okx.ts';
import { startBot } from '../runtime/index.ts';

export const start = async (body: AnyRecord = {}) => {
  const cfg = getConfig();
  const equity = await fetchAccountTotalEq(cfg);
  saveConfig({ initial_equity: equity, current_equity: equity });

  startBot(body.interval_sec);
  return { success: true };
};
