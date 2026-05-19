// sysinfo 格式化工具

// Ring 周长 (r=42): 2π·42
export const RING_C = 263.89;

export const ringOffset = (usage) => RING_C * (1 - (usage || 0));

export const pct = (x) => Math.round((x || 0) * 100);
export const gb = (b) => ((b || 0) / (1024 ** 3)).toFixed(1) + ' GB';

export function fmtUptime(s) {
    if (!s) return '';
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return [d && `${d} 天`, h && `${h} 小时`, `${m} 分`].filter(Boolean).join(' ');
}

export function loadColor(load, cores) {
    const ratio = load / Math.max(1, cores);
    if (ratio < 0.7) return 'good';
    if (ratio < 1.2) return 'warn';
    return 'bad';
}

export function diskTone(capacity) {
    if (capacity > 0.9) return 'bad';
    if (capacity > 0.75) return 'warn';
    return 'mute';
}
