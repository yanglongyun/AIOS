import { json } from "../../../shared/http/json.js";
import { getAuthUser } from "../../../shared/auth/guard.js";
const me = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: "\u672A\u767B\u5F55" }, 401);
  }
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
export {
  me
};
