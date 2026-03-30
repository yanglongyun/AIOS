import { findSessionExists, deleteChaptersAndResetSession } from "../repository/reset.js";
const reset = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: "sessionId \u65E0\u6548" };
  const session = findSessionExists(id);
  if (!session) return { status: 404, message: "\u6545\u4E8B\u4E0D\u5B58\u5728" };
  deleteChaptersAndResetSession(id);
  return { success: true };
};
export {
  reset
};
