import { listRecentTimelineRows } from "../main/repository/timeline/list.js";

const timeline = (currentConversationId = "") => {
  const rows = listRecentTimelineRows(currentConversationId, 10);
  if (!rows.length) return "";
  const lines = rows.map((row, index) => {
    const content = String(row.content || "").replace(/\s+/g, " ").trim();
    const source = row.source_app ? `[${row.source_app}]` : "";
    return `${index + 1}. ${source} ${content}`.trim();
  });
  return `

## 系统历史记录
以下是系统中近期发生的事（对话、任务、记忆等各来源），仅作长期上下文参考：
${lines.join("\n")}`;
};

export {
  timeline
};
