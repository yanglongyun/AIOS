import { readBody } from '../../../shared/http/readBody.ts';
import { json } from '../../../shared/http/json.ts';
import { findUserAuthById, updateUserPasswordById, deleteAuthSessionsByUserId } from '../../../shared/auth/repository.ts';
import { hashPassword, verifyPassword } from '../../../shared/auth/password.ts';
import { getAuthUser } from '../../../shared/auth/guard.ts';

export const changePassword = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: '未登录' }, 401);
  }

  const body = await readBody(req);
  const oldPassword = String(body.oldPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!oldPassword || !newPassword) {
    return json(res, { success: false, message: '旧密码和新密码不能为空' }, 400);
  }
  if (newPassword.length < 6) {
    return json(res, { success: false, message: '新密码至少 6 位' }, 400);
  }

  const authUser = findUserAuthById(user.id);
  if (!authUser || !verifyPassword(oldPassword, authUser.password_hash)) {
    return json(res, { success: false, message: '旧密码错误' }, 400);
  }

  updateUserPasswordById(user.id, hashPassword(newPassword));
  deleteAuthSessionsByUserId(user.id);
  return json(res, { success: true });
};
