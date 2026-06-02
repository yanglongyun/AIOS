<script setup>
import { fmtMoney, fmtPct, num, posSize, posSide, posUpl, posUplRatio } from '../utils.js';

const props = defineProps({
    positions: { type: Object, default: null }
});

defineEmits(['refresh']);
</script>

<template>
    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">持仓</div>
                <div class="cb-sec-sub">
                    来自 OKX 实时账户。{{ positions?.balances?.totalEq ? '总权益: $' + Number(positions.balances.totalEq).toLocaleString() : '' }}
                </div>
            </div>
            <button class="cb-btn cb-btn-small cb-btn-ghost" @click="$emit('refresh')">
                <span class="msi xxs">refresh</span> 刷新
            </button>
        </header>

        <div v-if="!positions" class="cb-empty">读取中…</div>
        <div v-else-if="positions.success === false" class="cb-err-inline">{{ positions.message }}</div>
        <div v-else-if="positions.positionsError" class="cb-err-inline">{{ positions.positionsError }}</div>
        <div v-else-if="!positions.positions?.length" class="cb-empty">当前无持仓</div>

        <div v-else class="cb-table">
            <div class="cb-tr cb-tr-head">
                <div>合约</div>
                <div>方向</div>
                <div class="text-right">仓位</div>
                <div class="text-right">开仓价</div>
                <div class="text-right">标记价</div>
                <div class="text-right">未实现盈亏</div>
                <div class="text-right">杠杆</div>
            </div>
            <div v-for="p in positions.positions" :key="p.instId + '/' + p.posSide" class="cb-tr">
                <div class="cb-inst font-mono">{{ p.instId }}</div>
                <div>
                    <span class="cb-side" :class="posSide(p)">
                        {{ posSide(p) === 'long' ? '多' : (posSide(p) === 'short' ? '空' : '净') }}
                    </span>
                </div>
                <div class="text-right font-mono">{{ posSize(p) }}</div>
                <div class="text-right font-mono text-[var(--c-text-3)]">{{ num(p.avgPx, 6) }}</div>
                <div class="text-right font-mono">{{ num(p.markPx, 6) }}</div>
                <div class="text-right font-mono"
                     :class="posUpl(p) >= 0 ? 'text-[var(--c-bull)]' : 'text-[var(--c-bear)]'">
                    {{ fmtMoney(posUpl(p), true) }}
                    <span class="ml-1 text-[10.5px] opacity-75">{{ fmtPct(posUplRatio(p)) }}</span>
                </div>
                <div class="text-right font-mono text-[var(--c-text-3)]">{{ p.lever || '—' }}x</div>
            </div>
        </div>
    </article>
</template>

<style scoped>
.cb-table {
    display: flex;
    flex-direction: column;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 12px;
}
.cb-tr {
    display: grid;
    grid-template-columns: 1.6fr 60px 80px 100px 100px 1.6fr 70px;
    gap: 10px;
    padding: 9px 8px;
    align-items: center;
    border-bottom: 1px solid var(--c-line-soft);
    transition: background 0.12s;
}
.cb-tr:not(.cb-tr-head):hover { background: rgba(255,255,255,0.025); }
.cb-tr:last-child { border-bottom: 0; }
.cb-tr-head {
    font-size: 10px;
    color: var(--c-text-3);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    padding: 8px 8px 6px;
    border-bottom: 1px solid var(--c-line);
    background: rgba(255,255,255,0.015);
}

.cb-inst { font-size: 12.5px; color: var(--c-text); font-weight: 500; }

.cb-side {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 3px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.cb-side.long  { background: var(--c-bull-soft); color: var(--c-bull); border: 1px solid rgba(14,203,129,0.3); }
.cb-side.short { background: var(--c-bear-soft); color: var(--c-bear); border: 1px solid rgba(246,70,93,0.3); }
.cb-side.net   { background: rgba(255,255,255,0.04); color: var(--c-text-2); border: 1px solid var(--c-line); }

@media (max-width: 760px) {
    .cb-tr { grid-template-columns: 1.4fr 60px 80px 1.6fr; gap: 8px; }
    .cb-tr > :nth-child(4),
    .cb-tr > :nth-child(5),
    .cb-tr > :nth-child(7) { display: none; }
}
</style>
