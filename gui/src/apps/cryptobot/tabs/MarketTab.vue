<script setup>
import { fmtPct, fmtSmart, fmtTime, fmtVolume } from '../formatters';

defineProps({
    items: { type: Array, default: () => [] },
    updatedAt: { type: String, default: '' },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
});

defineEmits(['refresh']);
</script>

<template>
    <div class="mb-2 flex items-center gap-2 px-1">
        <div class="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_MARKET_OKX_SPOT__</div>
        <span class="h-1.5 w-1.5 rounded-full bg-good animate-status-pulse"></span>
        <span v-if="updatedAt" class="font-mono text-[10.5px] text-muted">{{ fmtTime(updatedAt) }}</span>
        <div class="flex-1"></div>
        <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-md border-0 bg-bg-hi text-muted hover:bg-line-hi hover:text-ink"
            @click="$emit('refresh')" :title="'__T_COMMON_REFRESH__'">
            <span class="msi" :class="{ spin: loading }" style="font-size:14px">refresh</span>
        </button>
    </div>

    <div v-if="error" class="rounded-md px-3 py-2 text-[12.5px] text-bad"
        style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
        {{ error }}
    </div>
    <div v-else-if="loading && !items.length" class="flex flex-col items-center gap-2 py-15 text-muted">
        <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
        <div class="text-[14px]">__T_CRYPTOBOT_LOADING__</div>
    </div>
    <div v-else-if="!items.length" class="rounded-md border border-line bg-bg-elev py-12 text-center text-[12.5px] text-faint">
        __T_CRYPTOBOT_MARKET_EMPTY__
    </div>

    <!-- Exchange-style ticker table -->
    <div v-else class="overflow-hidden rounded-md border border-line bg-bg-elev">
        <!-- Column header -->
        <div class="ticker-row ticker-head grid items-center gap-3 border-b border-line px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
            <div>__T_CRYPTOBOT_MARKET_MAJOR__</div>
            <div class="text-right">__T_CRYPTOBOT_MARK_PRICE__</div>
            <div class="text-right">24h %</div>
            <div class="text-right max-md:hidden">24h __T_CRYPTOBOT_HIGH__/__T_CRYPTOBOT_LOW__</div>
            <div class="text-right max-md:hidden">__T_CRYPTOBOT_MARKET_VOLUME_24H__</div>
        </div>

        <!-- Rows -->
        <div class="divide-y divide-line">
            <div v-for="m in items" :key="m.instId"
                class="ticker-row grid items-center gap-3 px-3 py-2 transition-colors hover:bg-bg-hi">
                <!-- Symbol -->
                <div class="flex items-center gap-2 min-w-0">
                    <span class="grid h-6 w-6 flex-none place-items-center rounded-full bg-bg-hi font-mono text-[9.5px] font-bold text-ink">
                        {{ m.base?.slice(0, 3) }}
                    </span>
                    <div class="min-w-0">
                        <div class="font-mono text-[13px] font-semibold text-ink leading-tight">{{ m.base }}<span class="text-faint">/USDT</span></div>
                        <div class="font-mono text-[10px] text-faint leading-tight max-md:hidden">{{ m.instId }}</div>
                    </div>
                </div>

                <!-- Last price -->
                <div class="text-right font-mono text-[13.5px] font-semibold text-ink tabular-nums">
                    {{ fmtSmart(m.last) }}
                </div>

                <!-- 24h % -->
                <div class="text-right">
                    <span class="inline-flex items-center justify-end rounded px-1.5 py-0.5 font-mono text-[12px] font-semibold tabular-nums"
                        :class="m.changeRatio >= 0
                            ? 'text-good bg-[color-mix(in_srgb,var(--color-good)_12%,transparent)]'
                            : 'text-bad bg-[color-mix(in_srgb,var(--color-bad)_12%,transparent)]'">
                        {{ fmtPct(m.changeRatio) }}
                    </span>
                </div>

                <!-- 24h high/low -->
                <div class="text-right font-mono text-[11.5px] text-muted tabular-nums max-md:hidden">
                    <div class="text-good">{{ fmtSmart(m.high24h) }}</div>
                    <div class="text-bad">{{ fmtSmart(m.low24h) }}</div>
                </div>

                <!-- Volume -->
                <div class="text-right font-mono text-[12px] text-muted tabular-nums max-md:hidden">
                    {{ fmtVolume(m.volCcy24h) }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ticker-row {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 1.2fr) minmax(0, 1fr);
}
@media (max-width: 768px) {
    .ticker-row {
        grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 0.8fr);
    }
}

.spin { animation: cb-spin 1s linear infinite; }
@keyframes cb-spin { to { transform: rotate(360deg); } }
.animate-status-pulse { animation: cb-pulse 1.4s ease-in-out infinite; }
@keyframes cb-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
</style>
