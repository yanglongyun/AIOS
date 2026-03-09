import { db } from './client.js';

export const countRecords = () => {
  return db.prepare('SELECT COUNT(*) AS c FROM apps_fortune_records').get().c;
};

export const listRecords = ({ limit, offset }) => {
  return db.prepare(`
    SELECT id, question, sign_name AS signName, sign_poem AS signPoem, good, bad, advice, hexagram, created_at AS createdAt
    FROM apps_fortune_records ORDER BY id DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
};
