export const today = () => new Date().toISOString().slice(0, 10);

export const sortTodos = (a, b) => (b.priority === 'high') - (a.priority === 'high') || String(a.due || '9999').localeCompare(String(b.due || '9999')) || b.id - a.id;

export function dueLabel(due) {
  if (!due) return { text: '', cls: '' };
  const diff = Math.round((new Date(due) - new Date(today())) / 86400000);
  if (diff < 0) return { text: `__T_TODO_OVERDUE_DAYS__`.replace('{n}', String(Math.abs(diff))), cls: 'late' };
  if (diff === 0) return { text: '__T_TIME_TODAY__', cls: 'soon' };
  if (diff === 1) return { text: '__T_TIME_TOMORROW__', cls: 'soon' };
  return { text: new Date(due).toLocaleDateString('__T__LOCALE_FULL__', { month: 'numeric', day: 'numeric' }), cls: '' };
}

export function parseLocal(raw) {
  let text = raw.trim();
  let due = '';
  const d = new Date();
  if (/明天/.test(text)) { d.setDate(d.getDate() + 1); due = d.toISOString().slice(0, 10); text = text.replace('明天', ''); }
  else if (/后天/.test(text)) { d.setDate(d.getDate() + 2); due = d.toISOString().slice(0, 10); text = text.replace('后天', ''); }
  else if (/今天/.test(text)) { due = today(); text = text.replace('今天', ''); }
  const priority = /(重要|紧急|高优先)/.test(text) ? 'high' : '';
  text = text.replace(/很重要|重要|紧急|高优先/g, '').trim();
  return { text: text || raw.trim(), due, priority, section: due && due > today() ? 'later' : 'today' };
}
