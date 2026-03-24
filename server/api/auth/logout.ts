import { json } from '../../../shared/http/json.ts';
import { deleteAuthSessionByTokenHash } from '../../../shared/auth/repository.ts';
import { buildClearSessionCookie, getSessionTokenFromRequest, hashSessionToken } from '../../../shared/auth/session.ts';

export const logout = async (req, res) => {
  const token = getSessionTokenFromRequest(req);
  if (token) deleteAuthSessionByTokenHash(hashSessionToken(token));
  res.setHeader('Set-Cookie', buildClearSessionCookie());
  return json(res, { success: true });
};
