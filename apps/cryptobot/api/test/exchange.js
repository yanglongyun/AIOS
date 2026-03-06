import { getConfig } from '../../db.js';
import { okxRequest } from '../../runtime/okx.js';

export const testExchangeHandler = async (body = {}) => {
  const saved = getConfig();
  const cfg = {
    base_url: String(body.base_url || saved.base_url || 'https://www.okx.com').trim(),
    api_key: String(body.api_key ?? saved.api_key).trim(),
    api_secret: String(body.api_secret ?? saved.api_secret).trim(),
    passphrase: String(body.passphrase ?? saved.passphrase).trim(),
  };

  if (!cfg.api_key || !cfg.api_secret || !cfg.passphrase) {
    throw new Error('API Key、Secret、Passphrase 均不能为空');
  }

  await okxRequest(cfg, 'GET', '/api/v5/account/balance');
  return { success: true, message: '连接成功' };
};
