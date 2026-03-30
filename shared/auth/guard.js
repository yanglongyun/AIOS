import {
  deleteExpiredAuthSessions,
  findAuthSessionByTokenHash,
  findUserById,
  touchAuthSession
} from "./repository.js";
import { getSessionTokenFromRequest, hashSessionToken } from "./session.js";
const isExpired = (expiresAt) => new Date(expiresAt).getTime() <= Date.now();
const getAuthUser = (req) => {
  try {
    deleteExpiredAuthSessions();
    const token = getSessionTokenFromRequest(req);
    if (!token) return null;
    const tokenHash = hashSessionToken(token);
    const session = findAuthSessionByTokenHash(tokenHash);
    if (!session) return null;
    if (!session.expires_at || isExpired(session.expires_at)) return null;
    const user = findUserById(session.user_id);
    if (!user) return null;
    touchAuthSession(session.id);
    return user;
  } catch {
    return null;
  }
};
export {
  getAuthUser
};
