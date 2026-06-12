export const money = (n) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });

export const dayLabel = (date) => {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(date);
  const diff = Math.round((new Date(today) - d) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' });
};
