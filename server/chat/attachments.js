import { resolve } from 'path';

export const normalizeAttachments = (raw) => {
  const baseDir = resolve(process.cwd(), 'files', 'uploads', 'chat');
  if (!Array.isArray(raw)) return [];
  return raw
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
};

export const buildAttachmentContext = (attachments = []) => {
  if (!attachments.length) return '';
  const lines = [
    '【附件文件路径】',
    ...attachments.map((f, i) => `${i + 1}. ${f.name}: ${f.path}`),
    '请先读取这些文件内容，再结合用户问题回答。'
  ];
  return lines.join('\n');
};
