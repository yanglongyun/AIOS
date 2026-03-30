import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { countUsers, createAuthSession, createUser, findUserByUsername } from "../../../shared/auth/repository.js";
import { hashPassword } from "../../../shared/auth/password.js";
import { buildSessionCookie, generateSessionToken, hashSessionToken, SESSION_TTL_SECONDS } from "../../../shared/auth/session.js";
import { normalizeUsername } from "../../../shared/auth/index.js";
const register = async (req, res) => {
  if (countUsers() > 0) {
    return json(res, { success: false, message: "\u7CFB\u7EDF\u5DF2\u521D\u59CB\u5316\uFF0C\u7981\u6B62\u516C\u5F00\u6CE8\u518C" }, 403);
  }
  const body = await readBody(req);
  const username = normalizeUsername(body.username);
  const password = String(body.password || "");
  if (!username || username.length < 3) {
    return json(res, { success: false, message: "\u7528\u6237\u540D\u81F3\u5C11 3 \u4E2A\u5B57\u7B26" }, 400);
  }
  if (!password || password.length < 6) {
    return json(res, { success: false, message: "\u5BC6\u7801\u81F3\u5C11 6 \u4F4D" }, 400);
  }
  if (findUserByUsername(username)) {
    return json(res, { success: false, message: "\u7528\u6237\u540D\u5DF2\u5B58\u5728" }, 409);
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
