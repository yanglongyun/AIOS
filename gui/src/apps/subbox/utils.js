// subbox 时间与文本格式化

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const pad2 = (n) => String(n).padStart(2, '0');
const dateOnly = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function fmtMasthead(d) {
    return `${dateOnly(d)} · 周${WEEKDAYS[d.getDay()]}`;
}

export function fmtMd(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtClock(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fmtRelDay(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const that = new Date(d); that.setHours(0, 0, 0, 0);
    const days = Math.round((today - that) / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days === 2) return '前天';
    if (days < 7) return `${days} 天前`;
    return dateOnly(d);
}

export function todayStr(now = new Date()) {
    return dateOnly(now);
}

export function previewLine(summary) {
    const t = String(summary || '').trim();
    if (!t) return '';
    const first = t.split('\n').find((l) => l.trim());
    return (first || '').slice(0, 80);
}
