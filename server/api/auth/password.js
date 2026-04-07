import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { findUserAuthById, updateUserPasswordById, deleteAuthSessionsByUserId } from "../../../shared/auth/repository.js";
import { hashPassword, verifyPassword } from "../../../shared/auth/password.js";
import { getAuthUser } from "../../../shared/auth/guard.js";
const changePassword = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: "Unauthorized" }, 401);
  }
  const body = await readBody(req);
  const oldPassword = String(body.oldPassword || "");
  const newPassword = String(body.newPassword || "");
  if (!oldPassword || !newPassword) {
    return json(res, { success: false, message: "Old password and new password are required" }, 400);
  }
  if (newPassword.length < 6) {
    return json(res, { success: false, message: "New password must be at least 6 characters" }, 400);
  }
  const authUser = findUserAuthById(user.id);
  if (!authUser || !verifyPassword(oldPassword, authUser.password_hash)) {
    return json(res, { success: false, message: "Old password is incorrect" }, 400);
  }
  updateUserPasswordById(user.id, hashPassword(newPassword));
  deleteAuthSessionsByUserId(user.id);
  return json(res, { success: true });
};
export {
  changePassword
};
