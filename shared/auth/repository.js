import Database from 'better-sqlite3';

const db = new Database('database/aios.db');

const toIso = (date) => date.toISOString();

export const findUserByUsername = (username) => db.prepare(
  'SELECT id, username, password_hash, created_at FROM users WHERE username = ?'
).get(username);

export const findUserById = (id) => db.prepare(
  'SELECT id, username, created_at FROM users WHERE id = ?'
).get(id);

export const countUsers = () => {
  const row = db.prepare('SELECT COUNT(1) AS count FROM users').get();
  return Number(row?.count || 0);
};

export const createUser = (username, passwordHash) => {
  const stmt = db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, datetime(\'now\'))');
  const info = stmt.run(username, passwordHash);
  return findUserById(Number(info.lastInsertRowid));
};

export const createAuthSession = (userId, tokenHash, ttlSeconds) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  db.prepare(
    'INSERT INTO auth_sessions (user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, tokenHash, toIso(expiresAt), toIso(now), toIso(now));
  return { userId, tokenHash, expiresAt: toIso(expiresAt) };
};

export const findAuthSessionByTokenHash = (tokenHash) => db.prepare(
  `SELECT id, user_id, token_hash, expires_at, created_at, last_seen_at
   FROM auth_sessions
   WHERE token_hash = ?`
).get(tokenHash);

export const touchAuthSession = (id) => {
  db.prepare('UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?')
    .run(toIso(new Date()), id);
};

export const deleteAuthSessionByTokenHash = (tokenHash) => {
  db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(tokenHash);
};

export const deleteExpiredAuthSessions = () => {
  db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(toIso(new Date()));
};
