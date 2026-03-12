import { db } from './client.js';

export const getConfig = () => {
  const row = db.prepare('SELECT * FROM cryptobot_config WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO cryptobot_config (id, base_url, directive, interval_sec, inst_id, virtual_usdt, virtual_coin, initial_equity, updated_at)
      VALUES (1, 'https://www.okx.com', '', 300, 'BTC-USDT', 0, 0, 0, datetime('now'))
    `).run();
    return { id: 1, base_url: 'https://www.okx.com', api_key: '', api_secret: '', passphrase: '', directive: '', interval_sec: 300, inst_id: 'BTC-USDT', virtual_usdt: 0, virtual_coin: 0, initial_equity: 0 };
  }
  return row;
};

export const saveConfig = (patch = {}) => {
  const cfg = { ...getConfig(), ...patch };
  db.prepare(`
    UPDATE cryptobot_config
    SET base_url = ?, api_key = ?, api_secret = ?, passphrase = ?,
        directive = ?, interval_sec = ?, inst_id = ?,
        virtual_usdt = ?, virtual_coin = ?, initial_equity = ?,
        updated_at = datetime('now')
    WHERE id = 1
  `).run(
    cfg.base_url, cfg.api_key, cfg.api_secret, cfg.passphrase,
    cfg.directive, cfg.interval_sec, cfg.inst_id,
    cfg.virtual_usdt, cfg.virtual_coin, cfg.initial_equity
  );
  return getConfig();
};
