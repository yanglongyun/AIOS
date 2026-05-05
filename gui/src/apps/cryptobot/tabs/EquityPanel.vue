<script setup>
import { TrendingDown, TrendingUp } from 'lucide-vue-next';
import { fmtNum } from '../formatters';

defineProps({
    status: { type: Object, required: true },
});
</script>

<template>
    <section class="equity-panel relative overflow-hidden rounded-xl border border-line bg-bg-elev px-5 py-4">
        <!-- subtle grid scanlines for trading-desk feel -->
        <div class="grid-bg pointer-events-none absolute inset-0 opacity-40"></div>

        <div class="relative flex flex-wrap items-baseline justify-between gap-4">
            <div class="min-w-0">
                <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_EQUITY_TOTAL__</div>
                <div class="mt-1 flex items-baseline gap-2">
                    <span class="font-mono text-[34px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">{{ fmtNum(status.equity.current, 2) }}</span>
                    <span class="text-[12px] font-semibold tracking-[0.06em] text-faint">USDT</span>
                </div>
                <div v-if="typeof status.equity.pnl_ratio === 'number'"
                    class="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
                    :class="status.equity.pnl >= 0
                        ? 'text-good bg-[color-mix(in_srgb,var(--color-good)_14%,transparent)]'
                        : 'text-bad bg-[color-mix(in_srgb,var(--color-bad)_14%,transparent)]'">
                    <component :is="status.equity.pnl >= 0 ? TrendingUp : TrendingDown" :size="12" :stroke-width="2" />
                    {{ status.equity.pnl >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl, 2) }}
                    <span class="opacity-70">({{ status.equity.pnl >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl_ratio * 100, 2) }}%)</span>
                </div>
            </div>

            <div class="text-right">
                <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_TODAY__</div>
                <div class="mt-1 font-mono text-[18px] font-bold tabular-nums"
                    :class="status.equity.today_change >= 0 ? 'text-good' : 'text-bad'">
                    {{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change, 2) }}
                </div>
                <div class="mt-1 text-[11px] text-muted">
                    <span class="font-mono tabular-nums">{{ fmtNum(status.equity.initial, 2) }}</span>
                    <span class="ml-1 text-faint">__T_CRYPTOBOT_INITIAL_LABEL__</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.equity-panel {
    background:
        linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 4%, transparent), transparent 40%),
        var(--color-bg-elev);
}
.grid-bg {
    background-image:
        linear-gradient(to right, color-mix(in srgb, var(--color-line) 50%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--color-line) 50%, transparent) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom right, black, transparent 70%);
}
</style>
