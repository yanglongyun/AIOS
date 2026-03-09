import { createNotificationRow } from '../../repository/notifications/create.js';
import { broadcast } from '../../system/ws.js';

export const createNotification = ({ app, title, content } = {}) => {
  const appName = String(app || '').trim();
  const safeTitle = String(title || '').trim();
  const safeContent = String(content || '');

  if (!safeTitle) return { success: false, message: 'title 不能为空' };

  const row = createNotificationRow({ app: appName, title: safeTitle, content: safeContent });
  broadcast({ type: 'notifications_changed' });
  return row;
};
