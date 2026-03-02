import { db, getConfig } from '../../db.js';

export const saveExchangeHandler = (body = {}) => {
  const cfg = getConfig();
  db.prepare(`
    UPDATE apps_cryptobot_config
    SET base_url = ?, api_key = ?, api_secret = ?, passphrase = ?, updated_at = datetime('now')
    WHERE id = 1
  `).run(
    String(body.base_url || cfg.base_url).trim() || cfg.base_url,
    String(body.api_key ?? cfg.api_key).trim(),
    String(body.api_secret ?? cfg.api_secret).trim(),
    String(body.passphrase ?? cfg.passphrase).trim()
  );
  return { success: true };
};
