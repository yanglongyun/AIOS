const parseSqlDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString();
};

const formatCompactDateTime = (value) => {
  const date = value instanceof Date ? value : parseSqlDate(value);
  if (!date) return '-';
  return date.toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export {
  formatCompactDateTime,
  formatDateTime,
  parseSqlDate
};
