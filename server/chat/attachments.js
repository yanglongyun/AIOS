import { resolve } from 'path';

export const injectAttachmentsMessage = (messages = [], rawAttachments = []) => {
  const list = Array.isArray(messages) ? [...messages] : [];
  const baseDir = resolve(process.cwd(), 'files', 'uploads', 'chat');
  if (!Array.isArray(rawAttachments)) return { messages: list, attachments: [] };

  const attachments = rawAttachments
    .map((item) => ({
      name: String(item?.name || '').trim(),
      path: String(item?.path || '').trim(),
      size: Number(item?.size || 0)
    }))
    .filter((item) => {
      if (!item.name || !item.path) return false;
      const abs = resolve(item.path);
      return abs.startsWith(baseDir);
    })
    .slice(0, 10);

  if (!attachments.length || list.length === 0) return { messages: list, attachments: [] };

  const lastIndex = list.length - 1;
  const original = list[lastIndex];
  const context = [
    '【附件文件路径】',
    ...attachments.map((f, i) => `${i + 1}. ${f.name}: ${f.path}`),
    '请先读取这些文件内容，再结合用户问题回答。'
  ].join('\n');

  list[lastIndex] = {
    ...original,
    content: `${original?.content ?? ''}\n\n${context}`
  };
  return { messages: list, attachments };
};
