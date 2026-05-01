const fmtNum = (v, dec = 2) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: dec });
};

const fmtSmart = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return '—';
    if (Math.abs(n) >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
};

const fmtPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`;
};

const fmtVolume = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const fmtTime = (v) => {
    if (!v) return '';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fmtMs = (ms) => {
    if (!ms) return '';
    const n = Number(ms);
    if (!Number.isFinite(n)) return '';
    return fmtTime(new Date(n));
};

export { fmtMs, fmtNum, fmtPct, fmtSmart, fmtTime, fmtVolume };
