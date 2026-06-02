<script setup>
// 横向实时行情条 — 终端左栏底部。自带 4s 轮询;数据由父级 market 传入或自取。
import { computed } from 'vue';
import RollingNumber from './RollingNumber.vue';

const props = defineProps({
    market: { type: Object, default: null }   // { success, items, updatedAt }
});

const items = computed(() => (props.market?.success ? (props.market.items || []) : []));
const error = computed(() => (props.market && props.market.success === false ? props.market.message : ''));

const dec = (last) => (last >= 100 ? 2 : last >= 1 ? 3 : 5);
const pct = (t) => (t.changeRatio || 0) * 100;
const fmtUpd = (ts) => { const d = new Date(ts); return isNaN(d.getTime()) ? '' : d.toTimeString().slice(0, 8); };
</script>

<template>
    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">实时行情</div>
                <div class="cb-sec-sub">
                    OKX 现货 · 每 4 秒刷新
                    <span v-if="market?.updatedAt" class="text-[var(--c-bull)]"> · {{ fmtUpd(market.updatedAt) }}</span>
                </div>
            </div>
            <span class="ms-live"><span class="ms-dot"></span> LIVE</span>
        </header>

        <div v-if="error" class="cb-err-inline">{{ error }}</div>
        <div v-else-if="!items.length" class="cb-empty">读取行情中…</div>
        <div v-else class="ms-row">
            <div v-for="t in items" :key="t.instId" class="ms-card" :class="pct(t) >= 0 ? 'up' : 'down'">
                <div class="ms-sym">{{ t.base }}<i>/{{ t.quote }}</i></div>
                <div class="ms-px tabular-nums"><RollingNumber :value="t.last" :decimals="dec(t.last)" prefix="$" :duration="800" /></div>
                <div class="ms-ch">{{ pct(t) >= 0 ? '▲ +' : '▼ ' }}{{ pct(t).toFixed(2) }}%</div>
            </div>
        </div>
    </article>
</template>

<style scoped>
.ms-live { display: inline-flex; align-items: center; gap: 6px; flex: none; font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 700; letter-spacing: 0.12em; color: var(--c-bull); padding: 4px 10px; border-radius: 5px; background: var(--c-bull-soft); border: 1px solid rgba(43, 212, 164, 0.3); }
.ms-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c-bull); box-shadow: 0 0 8px var(--c-bull); animation: ms-blink 1.5s infinite; }
@keyframes ms-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.ms-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.ms-row::-webkit-scrollbar { height: 6px; }
.ms-row::-webkit-scrollbar-thumb { background: #20242f; border-radius: 6px; }
.ms-card { flex: none; width: 142px; padding: 12px 13px; border-radius: 12px; background: var(--c-card); border: 1px solid var(--c-line); position: relative; overflow: hidden; transition: transform 0.12s, border-color 0.2s; }
.ms-card:hover { transform: translateY(-2px); }
.ms-card.up:hover { border-color: rgba(43, 212, 164, 0.4); }
.ms-card.down:hover { border-color: rgba(255, 84, 112, 0.4); }
.ms-card::after { content: ''; position: absolute; inset: 0 0 auto 0; height: 2px; opacity: 0.55; background: linear-gradient(90deg, transparent, currentColor, transparent); }
.ms-card.up::after { color: var(--c-bull); }
.ms-card.down::after { color: var(--c-bear); }
.ms-sym { font-family: var(--font-mono, monospace); font-weight: 700; font-size: 14px; color: var(--c-text); }
.ms-sym i { color: var(--c-text-3); font-size: 10px; font-style: normal; }
.ms-px { font-family: var(--font-mono, monospace); font-size: 17px; font-weight: 600; margin-top: 7px; color: var(--c-text); }
.ms-ch { font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 700; margin-top: 3px; }
.ms-card.up .ms-ch { color: var(--c-bull); }
.ms-card.down .ms-ch { color: var(--c-bear); }
</style>
