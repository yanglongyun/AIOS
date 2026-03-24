import { createHash, randomBytes } from 'crypto';
import { parseCookieHeader, serializeCookie } from '../http/cookie.ts';

export const SESSION_COOKIE_NAME = 'aios_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export const generateSessionToken = () => randomBytes(32).toString('hex');

export const hashSessionToken = (token) => createHash('sha256').update(String(token || '')).digest('hex');

export const getSessionTokenFromRequest = (req) => {
  const cookies = parseCookieHeader(req?.headers?.cookie || '');
  return cookies[SESSION_COOKIE_NAME] || '';
};

export const buildSessionCookie = (token) => serializeCookie(SESSION_COOKIE_NAME, token, {
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
  httpOnly: true,
  sameSite: 'Lax'
});

export const buildClearSessionCookie = () => serializeCookie(SESSION_COOKIE_NAME, '', {
  path: '/',
  maxAge: 0,
  httpOnly: true,
  sameSite: 'Lax'
});
