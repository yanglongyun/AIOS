const matchField = (field, value, min, max) => {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = parseInt(field.slice(2));
    return step > 0 && value % step === 0;
  }
  return field.split(',').map(Number).includes(value);
};

export const shouldRunCron = (cronExpr, now) => {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, day, mon, wday] = parts;
  return matchField(min, now.getMinutes(), 0, 59)
    && matchField(hour, now.getHours(), 0, 23)
    && matchField(day, now.getDate(), 1, 31)
    && matchField(mon, now.getMonth() + 1, 1, 12)
    && matchField(wday, now.getDay(), 0, 6);
};
