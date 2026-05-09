<script setup>
import { fmtMoney, fmtPct } from './utils.js';

const props = defineProps({
    agent: { type: Object, default: null },
    eqPnl: { type: Number, default: 0 },
    eqPnlRatio: { type: Number, default: 0 },
    todayChange: { type: Number, default: 0 }
});
</script>

<template>
    <article class="cb-card cb-equity-card">
        <div class="min-w-0 flex-1">
            <div class="cb-eyebrow">账户净值</div>
            <div class="cb-big-num">{{ fmtMoney(agent.equity?.current) }}</div>
            <div class="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px]">
                <span class="cb-pnl-pill" :class="eqPnl >= 0 ? 'pos' : 'neg'">
                    <span class="msi xxs">{{ eqPnl >= 0 ? 'trending_up' : 'trending_down' }}</span>
                    {{ fmtPct(eqPnlRatio) }} · {{ fmtMoney(eqPnl, true) }}
                </span>
                <span class="text-[var(--c-text-3)]">初始 {{ fmtMoney(agent.equity?.initial) }}</span>
                <span v-if="todayChange !== 0" class="text-[var(--c-text-3)]">
                    今日 <strong class="font-semibold" :class="todayChange >= 0 ? 'text-[var(--c-bull)]' : 'text-[var(--c-bear)]'">
                        {{ fmtMoney(todayChange, true) }}
                    </strong>
                </span>
            </div>
        </div>

        <svg v-if="agent.equity?.current" viewBox="0 0 200 64" class="cb-spark h-[72px] w-[260px] flex-none max-md:w-full">
            <defs>
                <linearGradient :id="'sg-' + (eqPnl >= 0 ? 'pos' : 'neg')" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="eqPnl >= 0 ? '#34a853' : '#d93025'" stop-opacity="0.18" />
                    <stop offset="100%" :stop-color="eqPnl >= 0 ? '#34a853' : '#d93025'" stop-opacity="0" />
                </linearGradient>
            </defs>
            <polyline
                :points="eqPnl >= 0
                    ? '0,52 22,48 44,50 66,38 88,42 110,30 132,32 154,22 176,18 200,10'
                    : '0,12 22,18 44,16 66,28 88,24 110,38 132,34 154,46 176,50 200,58'"
                fill="none"
                :stroke="eqPnl >= 0 ? '#34a853' : '#d93025'"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            <polyline
                :points="(eqPnl >= 0
                    ? '0,52 22,48 44,50 66,38 88,42 110,30 132,32 154,22 176,18 200,10'
                    : '0,12 22,18 44,16 66,28 88,24 110,38 132,34 154,46 176,50 200,58') + ' 200,64 0,64'"
                :fill="'url(#sg-' + (eqPnl >= 0 ? 'pos' : 'neg') + ')'" />
        </svg>
    </article>
</template>

<style scoped>
/* 净值卡:右侧 sparkline + 左侧大数,左竖条金光 */
.cb-equity-card {
    display: flex;
    align-items: center;
    gap: 24px;
    background:
        radial-gradient(800px 200px at 100% 0%, rgba(14,203,129,0.05), transparent 70%),
        var(--c-card);
    position: relative;
    overflow: hidden;
}
.cb-equity-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--c-gold), transparent);
}

.cb-eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-text-3);
}

.cb-big-num {
    margin-top: 6px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 42px;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.01em;
    font-variant-numeric: tabular-nums;
    color: var(--c-text);
    text-shadow: 0 0 24px rgba(238,240,245,0.15);
}

.cb-pnl-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 12.5px;
    font-weight: 600;
}
.cb-pnl-pill.pos {
    background: var(--c-bull-soft);
    color: var(--c-bull);
    border: 1px solid rgba(14,203,129,0.3);
    box-shadow: 0 0 12px rgba(14,203,129,0.18);
}
.cb-pnl-pill.neg {
    background: var(--c-bear-soft);
    color: var(--c-bear);
    border: 1px solid rgba(246,70,93,0.3);
    box-shadow: 0 0 12px rgba(246,70,93,0.18);
}

.cb-spark { filter: drop-shadow(0 0 6px rgba(14,203,129,0.25)); }

@media (max-width: 760px) {
    .cb-equity-card { flex-direction: column; align-items: stretch; }
}
</style>
