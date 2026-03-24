import { db } from '../client.ts';

export const listSettingRows = () => {
  return db.prepare('SELECT key, value FROM settings').all();
};
