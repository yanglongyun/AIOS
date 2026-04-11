import { json } from "../../../shared/http/json.js";
import { getAuthUser } from "../../../shared/auth/guard.js";
const me = async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return json(res, { success: false, message: "Unauthorized" }, 401);
  }
  return json(res, { success: true, user: { id: user.id, username: user.username } });
};
export {
  me
};
