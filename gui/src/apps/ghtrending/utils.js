// ghtrending 渲染与映射工具
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export const renderMd = (t) => marked.parse(t || '');

export const fmtNum = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n));

const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python:     '#3572a5',
    Rust:       '#dea584',
    Go:         '#00add8',
    Java:       '#b07219',
    'C++':      '#f34b7d',
    Swift:      '#f05138',
    Kotlin:     '#A97BFF'
};
export const LANGS = Object.keys(LANG_COLORS);
export const langClr = (l) => LANG_COLORS[l] || '#8b949e';

export const TIME_FILTERS = [
    { id: 'weekly',  label: '__T_GH_WEEKLY__' },
    { id: 'monthly', label: '__T_GH_MONTHLY__' }
];
