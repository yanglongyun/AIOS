import { findSessionExists, deleteChaptersAndResetSession } from '../repository/reset.js';

export const reset = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: 'sessionId 无效' };

  const session = findSessionExists(id);
  if (!session) return { status: 404, message: '故事不存在' };

  deleteChaptersAndResetSession(id);
  return { success: true };
};
