import { json } from '../../../shared/http/json.js';
import { deleteAuthSessionByTokenHash } from '../../../shared/auth/repository.js';
import { buildClearSessionCookie, getSessionTokenFromRequest, hashSessionToken } from '../../../shared/auth/session.js';

export const logout = async (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (token) deleteAuthSessionByTokenHash(hashSessionToken(token));
  res.setHeader('Set-Cookie', buildClearSessionCookie());
  return json(res, { success: true });
};
