import { json } from '../utils/json.js';
import { getAuthUser } from './require.js';

export const me = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: '未登录' }, 401);
  }
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
