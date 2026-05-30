// cryptobot 格式化与字段映射工具

export function isToday(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString();
}

export function relTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const diffSec = (Date.now() - d.getTime()) / 1000;
    if (diffSec < 60) return Math.round(diffSec) + 's 前';
    if (diffSec < 3600) return Math.round(diffSec / 60) + ' 分前';
    if (diffSec < 86400) return Math.round(diffSec / 3600) + ' 小时前';
    return Math.round(diffSec / 86400) + ' 天前';
}

export function fmtMoney(v, sign = false) {
    const n = Number(v) || 0;
    const s = sign && n > 0 ? '+' : '';
    return s + '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPct(v) {
    const n = Number(v) || 0;
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
}

export function fmtTime(ts) {
    if (!ts) return '';
    const d = new Date(typeof ts === 'string' ? ts : Number(ts));
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return '今天 ' + d.toTimeString().slice(0, 5);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.toTimeString().slice(0, 5)}`;
}

export function num(v, digits = 4) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

// OKX position 字段映射
export function posSize(p) { return num(p.pos, 4); }

export function posSide(p) {
    const ps = String(p.posSide || '').toLowerCase();
    if (ps === 'long' || (ps === 'net' && Number(p.pos) > 0)) return 'long';
    if (ps === 'short' || (ps === 'net' && Number(p.pos) < 0)) return 'short';
    return 'net';
}

export function posUpl(p) { return Number(p.upl) || 0; }
export function posUplRatio(p) { return (Number(p.uplRatio) || 0) * 100; }

// OKX order 状态着色
const ORDER_STATE = {
    filled:           { label: '已成交', cls: 'success' },
    partially_filled: { label: '部分',   cls: 'pending' },
    live:             { label: '挂单中', cls: 'running' },
    canceled:         { label: '已撤单', cls: 'mute'    }
};

export function orderStateMeta(s) {
    return ORDER_STATE[String(s || '').toLowerCase()] || { label: s || '?', cls: 'mute' };
}

// AI 决策的市场立场
const STANCE = {
    bullish: { label: '看多', cls: 'bull', icon: 'trending_up' },
    bearish: { label: '看空', cls: 'bear', icon: 'trending_down' },
    neutral: { label: '观望', cls: 'mute', icon: 'trending_flat' }
};
export function stanceMeta(s) {
    return STANCE[String(s || 'neutral').toLowerCase()] || STANCE.neutral;
}

// 单个交易动作
const ACTION = {
    buy:   { label: '买入', cls: 'bull' },
    sell:  { label: '卖出', cls: 'bear' },
    close: { label: '平仓', cls: 'mute' },
    hold:  { label: '观望', cls: 'mute' }
};
export function actionMeta(t) {
    return ACTION[String(t || 'hold').toLowerCase()] || { label: t || '?', cls: 'mute' };
}
