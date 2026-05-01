<script setup>
import { fmtNum } from '../formatters';

defineProps({
    status: { type: Object, required: true },
});
</script>

<template>
    <section class="rounded-2xl border border-line bg-bg-elev px-5 py-4">
        <div class="flex items-baseline justify-between">
            <div>
                <div class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_EQUITY_TOTAL__</div>
                <div class="mt-1 flex items-baseline gap-1">
                    <span class="text-[32px] font-semibold leading-none tracking-tight text-ink">{{ fmtNum(status.equity.current, 2) }}</span>
                    <span class="text-[14px] text-muted">USDT</span>
                </div>
            </div>
            <div class="text-right">
                <div class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_TODAY__</div>
                <div class="mt-1 text-[15px] font-semibold" :class="status.equity.today_change >= 0 ? 'text-good' : 'text-bad'">
                    {{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change, 2) }}
                </div>
            </div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
            <div class="flex justify-between">
                <span class="text-muted">__T_CRYPTOBOT_INITIAL_LABEL__</span>
                <span class="text-ink">{{ fmtNum(status.equity.initial, 2) }}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-muted">__T_CRYPTOBOT_PNL_TOTAL__</span>
                <span :class="status.equity.pnl >= 0 ? 'text-good' : 'text-bad'">
                    {{ status.equity.pnl >= 0 ? '+' : '' }}{{ fmtNum(status.equity.pnl, 2) }}
                    <span class="text-faint">({{ fmtNum(status.equity.pnl_ratio * 100, 1) }}%)</span>
                </span>
            </div>
        </div>
    </section>
</template>
