import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { countUsers, findUserByUsername, createAuthSession } from "../../../shared/auth/repository.js";
import { verifyPassword } from "../../../shared/auth/password.js";
import { buildSessionCookie, generateSessionToken, hashSessionToken, SESSION_TTL_SECONDS } from "../../../shared/auth/session.js";
import { normalizeUsername } from "../../../shared/auth/index.js";
const login = async (req, res) => {
  if (countUsers() === 0) {
    return json(res, { success: false, message: "System is not initialized. Complete setup first." }, 400);
  }
  const body = await readBody(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  if (!username || !password) {
    return json(res, { success: false, message: "Username and password are required" }, 400);
  }
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(res, { success: false, message: "Invalid username or password" }, 401);
  }
  const token = generateSessionToken();
  createAuthSession(user.id, hashSessionToken(token), SESSION_TTL_SECONDS);
  res.setHeader("Set-Cookie", buildSessionCookie(token));
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
export {
  login
};
