import {
  listHeadRemarkRows,
  listRemarkRows,
  listTailRemarkRows
} from "../../repository/chat/remarks.js";

const REMARK_RE = /<remark>([\s\S]*?)<\/remark>/g;
const REMARK_OPEN = "<remark";
const REMARK_CLOSE = "</remark>";

const extractRemark = (text) => {
  const src = String(text || "");
  const found = [];
  src.replace(REMARK_RE, (_, body) => {
    const trimmed = String(body || "").trim();
    if (trimmed) found.push(trimmed);
    return "";
  });
  const content = src.replace(REMARK_RE, "").replace(/\n{3,}/g, "\n\n").trim();
  const remark = found.length ? found.join("\n\n") : null;
  return { content, remark };
};

// 长对话注入策略:头 head 条 + 尾 tail 条,中间跳过(由 remark 自身承接)
const firstAndRecentRemarks = (conversationId, head = 10, tail = 20) => {
  const heads = listHeadRemarkRows(conversationId, head);
  const tails = listTailRemarkRows(conversationId, tail);
  const seen = new Set();
  const merged = [];
  for (const row of heads) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  for (const row of tails) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  merged.sort((a, b) => a.id - b.id);
  return merged.map((r) => r.remark);
};

// UI 面板用:返回当前对话的全部 remark,按时间正序
const listAllRemarks = (conversationId) => {
  return listRemarkRows(conversationId).map((r) => ({
    id: r.id,
    remark: r.remark,
    createdAt: r.created_at
  }));
};

// 流式过滤器:只吞掉 <remark>...</remark> 块,其它正文继续按 delta 转发。
// 完整 remark 仍在流结束后从 message.content 抽取并落库。
const createRemarkStreamFilter = (forward) => {
  let buffer = "";
  let inRemark = false;
  const forwardText = (text) => { if (text) forward(text); };
  const drain = (force = false) => {
    while (buffer) {
      if (inRemark) {
        const end = buffer.indexOf(REMARK_CLOSE);
        if (end === -1) {
          buffer = force ? "" : buffer.slice(-(REMARK_CLOSE.length - 1));
          return;
        }
        buffer = buffer.slice(end + REMARK_CLOSE.length);
        inRemark = false;
        continue;
      }

      const start = buffer.indexOf(REMARK_OPEN);
      if (start === -1) {
        const safeLen = force ? buffer.length : Math.max(0, buffer.length - (REMARK_OPEN.length - 1));
        if (safeLen > 0) {
          forwardText(buffer.slice(0, safeLen));
          buffer = buffer.slice(safeLen);
        }
        return;
      }

      forwardText(buffer.slice(0, start));
      buffer = buffer.slice(start + REMARK_OPEN.length);
      inRemark = true;
    }
  };
  return {
    push(chunk) {
      buffer += String(chunk || "");
      drain();
    },
    flush() {
      drain(true);
      if (!inRemark && buffer) forwardText(buffer);
      buffer = "";
      inRemark = false;
    }
  };
};

export {
  extractRemark,
  firstAndRecentRemarks,
  listAllRemarks,
  createRemarkStreamFilter
};
