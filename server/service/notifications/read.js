import { getNotificationById, markNotificationRead } from '../../repository/notifications/read.js';

export const markRead = ({ id, reply } = {}) => {
  const parsedId = Number(id || 0);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return { success: false, message: 'id 无效' };
  }

  markNotificationRead({ id: parsedId, reply });
  return getNotificationById(parsedId);
};
