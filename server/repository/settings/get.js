import { db } from '../../db/client.js';

export const listSettingRows = () => {
  return db.prepare('SELECT key, value FROM settings').all();
};
