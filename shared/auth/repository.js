import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "..", "..", "database", "aios.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
const toIso = (date) => date.toISOString();
const findUserByUsername = (username) => db.prepare(
  "SELECT id, username, password_hash, created_at FROM users WHERE username = ?"
).get(username);
const findUserById = (id) => db.prepare(
  "SELECT id, username, created_at FROM users WHERE id = ?"
).get(id);
const findUserAuthById = (id) => db.prepare(
  "SELECT id, username, password_hash, created_at FROM users WHERE id = ?"
).get(id);
const countUsers = () => {
  const row = db.prepare("SELECT COUNT(1) AS count FROM users").get();
  return Number(row?.count || 0);
};
const createUser = (username, passwordHash) => {
  const stmt = db.prepare("INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, datetime('now'))");
  const info = stmt.run(username, passwordHash);
  return findUserById(Number(info.lastInsertRowid));
};
const updateUserPasswordById = (id, passwordHash) => {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
};
const createAuthSession = (userId, tokenHash, ttlSeconds) => {
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1e3);
  db.prepare(
    "INSERT INTO sessions (user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)"
  ).run(userId, tokenHash, toIso(expiresAt), toIso(now), toIso(now));
  return { userId, tokenHash, expiresAt: toIso(expiresAt) };
};
const findAuthSessionByTokenHash = (tokenHash) => db.prepare(
  `SELECT id, user_id, token_hash, expires_at, created_at, last_seen_at
   FROM sessions
   WHERE token_hash = ?`
).get(tokenHash);
const touchAuthSession = (id) => {
  db.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").run(toIso(/* @__PURE__ */ new Date()), id);
};
const deleteAuthSessionByTokenHash = (tokenHash) => {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
};
const deleteAuthSessionsByUserId = (userId) => {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
};
const deleteAllAuthSessions = () => {
  db.prepare("DELETE FROM sessions").run();
};
const deleteExpiredAuthSessions = () => {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(toIso(/* @__PURE__ */ new Date()));
};
export {
  countUsers,
  createAuthSession,
  createUser,
  deleteAllAuthSessions,
  deleteAuthSessionByTokenHash,
  deleteAuthSessionsByUserId,
  deleteExpiredAuthSessions,
  findAuthSessionByTokenHash,
  findUserAuthById,
  findUserById,
  findUserByUsername,
  touchAuthSession,
  updateUserPasswordById
};
