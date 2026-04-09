import { findSessionExists, deleteChaptersAndResetSession } from "../repository/reset.js";
const reset = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: "Invalid sessionId" };
  const session = findSessionExists(id);
  if (!session) return { status: 404, message: "Story not found" };
  deleteChaptersAndResetSession(id);
  return { success: true };
};
export {
  reset
};
