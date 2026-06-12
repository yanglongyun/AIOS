export const PALETTE = ['#fdf6e3', '#fbeef1', '#e8f5ec', '#e8f1fa', '#f1edfa', '#fdf0e7', '#e6f4f3', '#ffffff'];
export const ACCENTS = {
  '#fdf6e3': '#d9b04e',
  '#fbeef1': '#e398ad',
  '#e8f5ec': '#7cc394',
  '#e8f1fa': '#83abdc',
  '#f1edfa': '#a893da',
  '#fdf0e7': '#e6a374',
  '#e6f4f3': '#6cbab5',
  '#ffffff': '#c4bcb0',
};
export const accentOf = (color) => ACCENTS[color] || ACCENTS['#ffffff'];
export const tiltOf = (id) => {
  const n = typeof id === 'number' ? id : String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return [-0.6, 0, 0.6][Math.abs(n) % 3];
};
export const noteStyle = (note) => {
  const bg = note.color || '#ffffff';
  return {
    background: bg,
    borderColor: `color-mix(in srgb, ${bg} 92%, var(--color-ink))`,
    transform: `rotate(${tiltOf(note.id)}deg)`,
  };
};

export const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const inlineMd = (s) => escapeHtml(s)
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`(.*?)`/g, '<code>$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
export const renderMd = (src) => String(src || '').split('\n').map((line) => {
  if (/^###\s+/.test(line)) return `<h3>${inlineMd(line.replace(/^###\s+/, ''))}</h3>`;
  if (/^##\s+/.test(line)) return `<h2>${inlineMd(line.replace(/^##\s+/, ''))}</h2>`;
  if (/^#\s+/.test(line)) return `<h1>${inlineMd(line.replace(/^#\s+/, ''))}</h1>`;
  if (/^>\s?/.test(line)) return `<blockquote>${inlineMd(line.replace(/^>\s?/, ''))}</blockquote>`;
  if (/^---+$/.test(line.trim())) return '<hr>';
  const task = line.match(/^[-*]\s+\[( |x)\]\s+(.*)$/i);
  if (task) return `<p class="task ${task[1].toLowerCase() === 'x' ? 'done' : ''}"><span>${task[1].toLowerCase() === 'x' ? '✓' : ''}</span>${inlineMd(task[2])}</p>`;
  if (/^[-*]\s+/.test(line)) return `<p class="li">• ${inlineMd(line.replace(/^[-*]\s+/, ''))}</p>`;
  if (/^\d+\.\s+/.test(line)) return `<p class="li">${inlineMd(line)}</p>`;
  return line.trim() ? `<p>${inlineMd(line)}</p>` : '<br>';
}).join('');
export const snippet = (content) => String(content || '').split('\n').filter(Boolean).slice(0, 5).map((line) => {
  const task = line.match(/^[-*]\s+\[( |x)\]\s+(.*)$/i);
  return task ? `<div>${task[1].toLowerCase() === 'x' ? '☑' : '☐'} ${escapeHtml(task[2])}</div>` : `<div>${escapeHtml(line.replace(/^#+\s*/, ''))}</div>`;
}).join('');
export const timeAgo = (value) => {
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60000) return '__T_TIME_JUST_NOW__';
  if (diff < 3600000) return `__T_TIME_MINUTES_AGO__`.replace('{n}', String(Math.floor(diff / 60000)));
  if (diff < 86400000) return `__T_TIME_HOURS_AGO__`.replace('{n}', String(Math.floor(diff / 3600000)));
  return `__T_TIME_DAYS_AGO__`.replace('{n}', String(Math.floor(diff / 86400000)));
};
