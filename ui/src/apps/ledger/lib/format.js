export const money = (n) => Number(n || 0).toLocaleString('__T__LOCALE_FULL__', { maximumFractionDigits: 2 });

export const dayLabel = (date) => {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(date);
  const diff = Math.round((new Date(today) - d) / 86400000);
  if (diff === 0) return '__T_TIME_TODAY__';
  if (diff === 1) return '__T_TIME_YESTERDAY__';
  return d.toLocaleDateString('__T__LOCALE_FULL__', { month: 'numeric', day: 'numeric', weekday: 'short' });
};
