import { queryMessages, countUnread } from '../repository/list.js';

export const getList = ({ read = 'all' } = {}) => {
  const items = queryMessages(read);
  const unread = countUnread();
  return { success: true, data: items, unread };
};
