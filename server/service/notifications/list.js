import { listNotificationsByLimit, countUnreadNotifications } from '../../repository/notifications/list.js';

export const listNotifications = ({ limit = 20 } = {}) => {
  const parsed = Number(limit);
  const safeLimit = Number.isFinite(parsed) ? Math.max(1, Math.min(200, parsed)) : 20;
  return listNotificationsByLimit(safeLimit);
};

export const countUnread = () => {
  return countUnreadNotifications();
};
