// @ts-nocheck
import { listMemories } from "../../repository/memories/index.js";

const memory = () => {
  const pinned = listMemories({ enabled: 1, visibility: "pinned" });
  const starred = listMemories({ enabled: 1, visibility: "starred" });
  if (pinned.length === 0 && starred.length === 0) return "";

  const lines = ["", "## 记忆", "<memories>"];

  if (pinned.length) {
    lines.push("");
    lines.push("[pinned] 以下是必读内容,请视作常识:");
    for (const item of pinned) {
      lines.push("");
      lines.push(`### ${item.title}`);
      if (item.description) lines.push(`_${item.description}_`);
      lines.push(item.content);
    }
  }

  if (starred.length) {
    lines.push("");
    lines.push("[starred] 以下记忆只列标题和描述。需要全文时用 shell 只读查询 SQLite:");
    for (const item of starred) {
      const desc = item.description ? ` — ${item.description}` : "";
      lines.push(`- #${item.id} · ${item.title}${desc}`);
    }
  }

  lines.push("");
  lines.push("查询记忆示例: sqlite3 -readonly database/agent.db \"SELECT * FROM memories WHERE id=42;\"");
  lines.push("</memories>");
  return lines.join("\n");
};

export { memory };
