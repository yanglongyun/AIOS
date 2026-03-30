import { resolve } from "path";
const injectAttachmentsMessage = (messages = [], rawAttachments = []) => {
  const list = Array.isArray(messages) ? [...messages] : [];
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0 || list.length === 0) {
    return { messages: list, attachments: [] };
  }
  const baseDir = resolve(process.cwd(), "files", "uploads", "chat");
  const validAttachments = [];
  const contextParts = [];
  const fileParts = [];
  for (const item of rawAttachments) {
    if (!item) continue;
    if (item.type === "context") {
      const label = String(item.label || "").trim();
      if (label) {
        validAttachments.push({ type: "context", scene: item.scene, label });
        contextParts.push(`[\u5F53\u524D\u5E94\u7528: ${label}]`);
      }
      continue;
    }
    if (item.type !== "file") continue;
    const name = String(item.name || "").trim();
    const path = String(item.path || "").trim();
    const size = Number(item.size || 0);
    if (!name || !path) continue;
    const abs = resolve(path);
    if (!abs.startsWith(baseDir)) continue;
    validAttachments.push({ type: "file", name, path, size });
    fileParts.push(`${fileParts.length + 1}. ${name}: ${path}`);
  }
  if (!validAttachments.length) return { messages: list, attachments: [] };
  const parts = [];
  if (contextParts.length) parts.push(contextParts.join("\n"));
  if (fileParts.length) {
    parts.push(["\u3010\u9644\u4EF6\u6587\u4EF6\u8DEF\u5F84\u3011", ...fileParts, "\u8BF7\u5148\u8BFB\u53D6\u8FD9\u4E9B\u6587\u4EF6\u5185\u5BB9\uFF0C\u518D\u7ED3\u5408\u7528\u6237\u95EE\u9898\u56DE\u7B54\u3002"].join("\n"));
  }
  if (parts.length) {
    const lastIndex = list.length - 1;
    const original = list[lastIndex];
    list[lastIndex] = {
      ...original,
      content: `${original?.content ?? ""}

${parts.join("\n\n")}`
    };
  }
  return { messages: list, attachments: validAttachments };
};
export {
  injectAttachmentsMessage
};
