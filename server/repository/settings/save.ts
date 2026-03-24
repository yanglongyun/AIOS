import { db } from '../client.ts';

export const saveSetting = (key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
};
