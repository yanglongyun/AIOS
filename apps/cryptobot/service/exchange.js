import { getConfig, saveConfig } from '../repository/config.js';

export const saveExchange = (body = {}) => {
  const cfg = getConfig();
  const pick = (input, fallback) => {
    if (input === undefined || input === null) return fallback;
    const text = String(input).trim();
    return text ? text : fallback;
  };

  saveConfig({
    base_url: pick(body.base_url, cfg.base_url),
    api_key: pick(body.api_key, cfg.api_key),
    api_secret: pick(body.api_secret, cfg.api_secret),
    passphrase: pick(body.passphrase, cfg.passphrase)
  });
  return { success: true };
};
