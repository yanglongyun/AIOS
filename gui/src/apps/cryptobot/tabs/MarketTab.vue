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
        <div>
            <div class="text-[15px] font-semibold text-ink">__T_CRYPTOBOT_MARKET_MAJOR__</div>
            <div class="text-[11.5px] text-faint">
                <span>__T_CRYPTOBOT_MARKET_OKX_SPOT__</span>
                <span v-if="updatedAt"> · {{ fmtTime(updatedAt) }}</span>
            </div>
        </div>
        <div class="flex-1"></div>
        <button class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-bg-hi text-muted hover:bg-line-hi hover:text-ink"
            @click="$emit('refresh')" title="__T_CRYPTOBOT_REFRESH__">
            <span class="msi sm" :class="{ spin: loading }">refresh</span>
        </button>
    </div>

    <div v-if="error" class="rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
        style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
        {{ error }}
    </div>
    <div v-else-if="loading && !items.length" class="flex flex-col items-center gap-2 py-15 text-muted">
        <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
        <div class="text-[14px]">__T_CRYPTOBOT_LOADING__</div>
    </div>
    <div v-else-if="!items.length" class="rounded-2xl border border-line bg-bg-elev py-12 text-center text-[12.5px] text-faint">
        __T_CRYPTOBOT_MARKET_EMPTY__
    </div>
    <ul v-else class="m-0 grid list-none grid-cols-1 gap-2 p-0 lg:grid-cols-2">
        <li v-for="m in items" :key="m.instId"
            class="rounded-2xl border border-line bg-bg-elev px-4 py-3 transition-colors hover:bg-card-hi">
            <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-bg-hi font-mono text-[11px] font-semibold text-ink">
                        {{ m.base?.slice(0, 4) }}
                    </span>
                    <div class="min-w-0">
                        <div class="flex items-baseline gap-2">
                            <span class="text-[15px] font-semibold text-ink">{{ m.base }}</span>
                            <span class="text-[11px] text-faint">{{ m.instId }}</span>
                        </div>
                        <div class="mt-0.5 text-[11.5px] text-muted">
                            __T_CRYPTOBOT_MARKET_VOLUME_24H__ {{ fmtVolume(m.volCcy24h) }} USDT
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-mono text-[17px] font-semibold text-ink">{{ fmtSmart(m.last) }}</div>
                    <div class="mt-0.5 text-[12px] font-semibold"
                        :class="m.changeRatio >= 0 ? 'text-good' : 'text-bad'">
                        {{ fmtPct(m.changeRatio) }}
                    </div>
                </div>
            </div>
            <div class="mt-3 grid grid-cols-3 gap-x-3 text-[11.5px]">
                <div>
                    <div class="text-faint">__T_CRYPTOBOT_HIGH__</div>
                    <div class="mt-0.5 font-mono text-ink">{{ fmtSmart(m.high24h) }}</div>
                </div>
                <div>
                    <div class="text-faint">__T_CRYPTOBOT_LOW__</div>
                    <div class="mt-0.5 font-mono text-ink">{{ fmtSmart(m.low24h) }}</div>
                </div>
                <div>
                    <div class="text-faint">__T_CRYPTOBOT_BID_ASK__</div>
                    <div class="mt-0.5 truncate font-mono text-ink">{{ fmtSmart(m.bidPx) }} / {{ fmtSmart(m.askPx) }}</div>
                </div>
            </div>
        </li>
    </ul>
</template>

<style scoped>
.spin { animation: cb-spin 1s linear infinite; }
@keyframes cb-spin { to { transform: rotate(360deg); } }
</style>
