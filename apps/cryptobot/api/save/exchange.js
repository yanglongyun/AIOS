import { db, getConfig } from '../../db.js';

export const saveExchangeHandler = (body = {}) => {
  const cfg = getConfig();
  const pick = (input, fallback) => {
    if (input === undefined || input === null) return fallback;
    const text = String(input).trim();
    return text ? text : fallback;
  };

  db.prepare(`
    UPDATE apps_cryptobot_config
    SET base_url = ?, api_key = ?, api_secret = ?, passphrase = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(
    pick(body.base_url, cfg.base_url),
    pick(body.api_key, cfg.api_key),
    pick(body.api_secret, cfg.api_secret),
    pick(body.passphrase, cfg.passphrase)
  );
  return { success: true };
};
