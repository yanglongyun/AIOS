import { listResources } from '../../service/resources/list.js';

export const resources = () => {
  let rows;
  try {
    rows = listResources();
  } catch {
    return '';
  }
  if (!rows || rows.length === 0) return '';

  const items = rows.map(r => `- ${r.title}: ${r.content || '(空)'}`).join('\n');
  return `\n\n## 资源\n用户配置的外部能力与密钥，可按需使用：\n${items}`;
};
