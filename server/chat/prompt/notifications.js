import { countUnread } from '../../api/notifications/list.js';

export const notifications = () => {
  const unread = countUnread();
  if (!(unread > 0)) return '';
  return `\n\n## 通知
你有 ${unread} 条未读通知。可以用 shell 执行 \`curl -H "Authorization: Bearer <INTERNAL_TOKEN_BY_RUNTIME>" http://127.0.0.1:9700/api/notifications\` 查看详情，用 \`curl -X POST http://127.0.0.1:9700/api/notifications/read -H "Authorization: Bearer <INTERNAL_TOKEN_BY_RUNTIME>" -H "Content-Type: application/json" -d '{"id":通知ID,"reply":"处理说明"}'\` 标记已读。`;
};
