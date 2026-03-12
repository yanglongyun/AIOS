import { db } from '../client.js';

export const listSettingRows = () => {
  return db.prepare('SELECT key, value FROM settings').all();
};
