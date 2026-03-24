import type { CookieSerializeOptions } from '../types.ts';

export const parseCookieHeader = (cookieHeader = '') => {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    // Keep the first value for duplicated cookie keys.
    // Browsers typically send longer-path cookies earlier; overriding can pick stale tokens.
    if (result[key] !== undefined) continue;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      // Ignore malformed cookie fragments instead of breaking whole auth parsing.
      continue;
    }
  }
  return result;
};

export const serializeCookie = (name: string, value: string, options: CookieSerializeOptions = {}) => {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${options.path || '/'}`);
  if (typeof options.maxAge === 'number') segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly !== false) segments.push('HttpOnly');
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  if (options.secure) segments.push('Secure');
  return segments.join('; ');
};
