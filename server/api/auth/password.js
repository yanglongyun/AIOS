import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { findUserAuthById, updateUserPasswordById, deleteAuthSessionsByUserId } from "../../../shared/auth/repository.js";
import { hashPassword, verifyPassword } from "../../../shared/auth/password.js";
import { getAuthUser } from "../../../shared/auth/guard.js";
const changePassword = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: "\u672A\u767B\u5F55" }, 401);
  }
  const body = await readBody(req);
  const oldPassword = String(body.oldPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!oldPassword || !newPassword) {
    return json(res, { success: false, message: "\u65E7\u5BC6\u7801\u548C\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" }, 400);
  }
  if (newPassword.length < 6) {
    return json(res, { success: false, message: "\u65B0\u5BC6\u7801\u81F3\u5C11 6 \u4F4D" }, 400);
  }
  const authUser = findUserAuthById(user.id);
  if (!authUser || !verifyPassword(oldPassword, authUser.password_hash)) {
    return json(res, { success: false, message: "\u65E7\u5BC6\u7801\u9519\u8BEF" }, 400);
  }
  updateUserPasswordById(user.id, hashPassword(newPassword));
  deleteAuthSessionsByUserId(user.id);
  return json(res, { success: true });
};
export {
  changePassword
};
