import type { AnyRecord } from '../../../shared/types.ts';
import { getConfig, saveConfig } from '../repository/config.ts';

export const saveExchange = (body: AnyRecord = {}) => {
  const cfg = getConfig();
  const apiKey = String(body.api_key ?? '').trim();
  const apiSecret = String(body.api_secret ?? '').trim();
  const passphrase = String(body.passphrase ?? '').trim();
  if (!apiKey || !apiSecret || !passphrase) {
    throw new Error('API Key、Secret、Passphrase 均不能为空');
  }

  saveConfig({
    base_url: String(cfg.base_url || '').trim(),
    api_key: apiKey,
    api_secret: apiSecret,
    passphrase
  });
  return { success: true };
};
