const matchField = (field, value) => {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2), 10);
    return step > 0 && value % step === 0;
  }
  return field.split(',').map((x) => Number(x)).includes(value);
};

export const shouldRunCron = (expr, now) => {
  const parts = String(expr || '').trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, day, mon, wday] = parts;
  return matchField(min, now.getMinutes())
    && matchField(hour, now.getHours())
    && matchField(day, now.getDate())
    && matchField(mon, now.getMonth() + 1)
    && matchField(wday, now.getDay());
};
