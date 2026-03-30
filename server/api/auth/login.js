import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { countUsers, findUserByUsername, createAuthSession } from "../../../shared/auth/repository.js";
import { verifyPassword } from "../../../shared/auth/password.js";
import { buildSessionCookie, generateSessionToken, hashSessionToken, SESSION_TTL_SECONDS } from "../../../shared/auth/session.js";
import { normalizeUsername } from "../../../shared/auth/index.js";
const login = async (req, res) => {
  if (countUsers() === 0) {
    return json(res, { success: false, message: "\u7CFB\u7EDF\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u5148\u5B8C\u6210\u6B22\u8FCE\u5B89\u88C5\u6D41\u7A0B" }, 400);
  }
  const body = await readBody(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  if (!username || !password) {
    return json(res, { success: false, message: "\u7528\u6237\u540D\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" }, 400);
  }
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return json(res, { success: false, message: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF" }, 401);
  }
  const token = generateSessionToken();
  createAuthSession(user.id, hashSessionToken(token), SESSION_TTL_SECONDS);
  res.setHeader("Set-Cookie", buildSessionCookie(token));
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
export {
  login
};
