import { db } from "../repository/client.js";
const recentChats = () => {
  return db.prepare(`
    SELECT conversation_id, title, description
    FROM chats
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT 3
  `).all().map((row) => ({
    conversationId: row.conversation_id,
    title: String(row.title || "").trim(),
    description: String(row.description || "").trim().slice(0, 100)
  }));
};
const chats = (currentConversationId) => {
  const currentId = String(currentConversationId || "").trim();
  const list = recentChats();
  if (!currentId && (!Array.isArray(list) || list.length === 0)) return "";
  const recentLines = list.slice(0, 3).map((c, i) => `${i + 1}. ${c.title || "\u672A\u547D\u540D"} \uFF5C ${String(c.description || "").slice(0, 100)}`);
  let block = `

## \u4F1A\u8BDD\u4E0A\u4E0B\u6587`;
  if (currentId) {
    block += `
- \u5F53\u524D\u4F1A\u8BDDID\uFF1A${currentId}`;
  }
  if (recentLines.length) {
    block += `
- \u6700\u8FD1 3 \u6B21\u4F1A\u8BDD\uFF08\u6807\u9898\uFF5C\u63CF\u8FF0\u524D100\u5B57\uFF09\uFF1A
${recentLines.join("\n")}`;
  }
  return block;
};
export {
  chats
};
