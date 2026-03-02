import { db } from '../../app_shared/db/client.js';

const KEYS = ['img_api_url', 'img_api_key', 'img_model'];

export const getSettingsHandler = () => {
  const rows = db.prepare(`
    SELECT key, value FROM apps_lovehouse_settings WHERE key IN (${KEYS.map(() => '?').join(',')})
  `).all(...KEYS);

  const obj = {};
  for (const r of rows) obj[r.key] = r.value;

  return {
    imgApiUrl: obj.img_api_url || '',
    imgApiKey: obj.img_api_key || '',
    imgModel: obj.img_model || ''
  };
};

export const updateSettingsHandler = (body = {}) => {
  const tx = db.transaction(() => {
    if (body.imgApiUrl !== undefined) {
      db.prepare('INSERT OR REPLACE INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('img_api_url', String(body.imgApiUrl));
    }
    if (body.imgApiKey !== undefined) {
      db.prepare('INSERT OR REPLACE INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('img_api_key', String(body.imgApiKey));
    }
    if (body.imgModel !== undefined) {
      db.prepare('INSERT OR REPLACE INTO apps_lovehouse_settings (key, value) VALUES (?, ?)').run('img_model', String(body.imgModel));
    }
  });
  tx();
  return { success: true };
};
