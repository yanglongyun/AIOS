// notes 文本与时间工具

export function relTime(ts) {
    if (!ts) return '';
    const d = new Date(String(ts).replace(' ', 'T') + 'Z');
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffH = (now - d) / 3600000;
    if (diffH < 1) return `${Math.max(1, Math.floor(diffH * 60))} __T_TIME_MINUTES__ __T_TIME_AGO__`;
    if (diffH < 24) return `${Math.floor(diffH)} __T_TIME_HOURS__ __T_TIME_AGO__`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} __T_TIME_DAYS__ __T_TIME_AGO__`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function snippet(body, n = 100) {
    if (!body) return '';
    const t = String(body).replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
}
