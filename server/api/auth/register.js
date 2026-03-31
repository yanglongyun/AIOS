import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { countUsers, createAuthSession, createUser, findUserByUsername } from "../../../shared/auth/repository.js";
import { hashPassword } from "../../../shared/auth/password.js";
import { buildSessionCookie, generateSessionToken, hashSessionToken, SESSION_TTL_SECONDS } from "../../../shared/auth/session.js";
import { normalizeUsername } from "../../../shared/auth/index.js";
const register = async (req, res) => {
  if (countUsers() > 0) {
    return json(res, { success: false, message: "系统已初始化，禁止公开注册" }, 403);
  }
  const body = await readBody(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  if (!username || username.length < 3) {
    return json(res, { success: false, message: "用户名至少 3 个字符" }, 400);
  }
  if (!password || password.length < 6) {
    return json(res, { success: false, message: "密码至少 6 位" }, 400);
  }
  if (findUserByUsername(username)) {
    return json(res, { success: false, message: "用户名已存在" }, 409);
  }
  const user = createUser(username, hashPassword(password));
  const token = generateSessionToken();
  createAuthSession(user.id, hashSessionToken(token), SESSION_TTL_SECONDS);
  res.setHeader("Set-Cookie", buildSessionCookie(token));
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
export {
  register
};
