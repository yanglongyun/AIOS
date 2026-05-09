<script setup>
import { fmtMoney, fmtTime, num, orderStateMeta } from '../utils.js';

const props = defineProps({
    orders: { type: Object, default: null },
    filter: { type: String, default: 'ANY' }
});

defineEmits(['refresh', 'update:filter']);
</script>

<template>
    <article class="cb-card">
        <header class="cb-sec-head">
            <div>
                <div class="cb-sec-title">订单历史</div>
                <div class="cb-sec-sub">最近 50 条来自 OKX。</div>
            </div>
            <div class="flex items-center gap-1.5">
                <select class="cb-input cb-input-select cb-input-small"
                        :value="filter"
                        @change="$emit('update:filter', $event.target.value)">
                    <option value="ANY">全部类型</option>
                    <option value="SPOT">现货</option>
                    <option value="SWAP">永续</option>
                    <option value="FUTURES">交割</option>
                    <option value="MARGIN">杠杆</option>
                </select>
                <button class="cb-btn cb-btn-small cb-btn-ghost" @click="$emit('refresh')">
                    <span class="msi xxs">refresh</span>
                </button>
            </div>
        </header>

        <div v-if="!orders" class="cb-empty">读取中…</div>
        <div v-else-if="orders.success === false" class="cb-err-inline">{{ orders.message }}</div>
        <div v-else-if="!orders.items?.length" class="cb-empty">无订单记录</div>

        <div v-else class="cb-table cb-table-orders">
            <div class="cb-tr cb-tr-head">
                <div>合约 · 类型</div>
                <div>方向</div>
                <div class="text-right">数量</div>
                <div class="text-right">均价</div>
                <div>状态</div>
                <div class="text-right">PnL</div>
                <div class="text-right">时间</div>
            </div>
            <div v-for="o in orders.items" :key="o.ordId || (o.instId + o.cTime)" class="cb-tr">
                <div class="cb-inst font-mono">
                    {{ o.instId }}
                    <span class="cb-tag">{{ o.instType }}</span>
                </div>
                <div>
                    <span class="cb-side" :class="(o.side || '').toLowerCase() === 'buy' ? 'long' : 'short'">
                        {{ (o.side || '').toUpperCase() }}
                    </span>
                </div>
                <div class="text-right font-mono">{{ num(o.fillSz || o.sz, 4) }}</div>
                <div class="text-right font-mono text-[var(--c-text-3)]">{{ num(o.avgPx || o.px, 6) }}</div>
                <div>
                    <span class="cb-badge" :class="orderStateMeta(o.state).cls">{{ orderStateMeta(o.state).label }}</span>
                </div>
                <div class="text-right font-mono"
                     :class="(Number(o.pnl) || 0) >= 0 ? 'text-[var(--c-bull)]' : 'text-[var(--c-bear)]'">
                    {{ Number(o.pnl) ? fmtMoney(Number(o.pnl), true) : '—' }}
                </div>
                <div class="text-right font-mono text-[11px] text-[var(--c-text-3)]">{{ fmtTime(o.cTime) }}</div>
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
    grid-template-columns: 1.6fr 80px 90px 110px 90px 100px 100px;
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

.cb-tag {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 6px;
    background: rgba(255,255,255,0.05);
    color: var(--c-text-3);
    border: 1px solid var(--c-line);
    border-radius: 3px;
    font-size: 9.5px;
    letter-spacing: 0.06em;
    font-weight: 600;
}

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

.cb-badge {
    display: inline-block;
    padding: 3px 9px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.cb-badge.success { background: var(--c-bull-soft); color: var(--c-bull); border: 1px solid rgba(14,203,129,0.3); }
.cb-badge.pending { background: rgba(240,185,11,0.12); color: var(--c-gold); border: 1px solid rgba(240,185,11,0.3); }
.cb-badge.running { background: rgba(58,140,255,0.12); color: #5e9eff; border: 1px solid rgba(58,140,255,0.3); }
.cb-badge.mute    { background: rgba(255,255,255,0.04); color: var(--c-text-3); border: 1px solid var(--c-line); }

@media (max-width: 760px) {
    .cb-table-orders .cb-tr { grid-template-columns: 1.4fr 70px 80px 100px; gap: 8px; }
    .cb-table-orders .cb-tr > :nth-child(4),
    .cb-table-orders .cb-tr > :nth-child(6),
    .cb-table-orders .cb-tr > :nth-child(7) { display: none; }
}
</style>
