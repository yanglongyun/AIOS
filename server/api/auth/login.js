import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { findUserByUsername, createAuthSession } from '../../../shared/auth/repository.js';
import { verifyPassword } from '../../../shared/auth/password.js';
import {
  buildSessionCookie,
  generateSessionToken,
  hashSessionToken,
  SESSION_TTL_SECONDS
} from '../../../shared/auth/session.js';

const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

export const login = async (req, res) => {
  const body = await readBody(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');

  if (!username || !password) {
    return json(res, { success: false, message: '用户名和密码不能为空' }, 400);
  }

  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(res, { success: false, message: '用户名或密码错误' }, 401);
  }

  const token = generateSessionToken();
  createAuthSession(user.id, hashSessionToken(token), SESSION_TTL_SECONDS);
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
