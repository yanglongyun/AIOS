<script setup>
import { fmtNum, fmtSmart } from '../formatters';

defineProps({
    data: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
});

defineEmits(['refresh']);
</script>

<template>
    <div v-if="loading && !data" class="flex flex-col items-center gap-2 py-15 text-muted">
        <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
        <div class="text-[14px]">__T_CRYPTOBOT_LOADING__</div>
    </div>
    <div v-else-if="error" class="rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
        style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
        {{ error }}
    </div>
    <template v-else-if="data">
        <section v-if="data.balances" class="rounded-2xl border border-line bg-bg-elev px-5 py-4">
            <div class="flex items-baseline justify-between">
                <div>
                    <div class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_EQUITY_TOTAL__</div>
                    <div class="mt-1 flex items-baseline gap-1">
                        <span class="text-[28px] font-semibold leading-none tracking-tight text-ink">{{ fmtNum(data.balances.totalEq, 2) }}</span>
                        <span class="text-[13px] text-muted">USDT</span>
                    </div>
                </div>
                <button class="grid h-9 w-9 cursor-pointer place-items-center rounded-full border-0 bg-bg-hi text-muted hover:bg-line-hi hover:text-ink"
                    @click="$emit('refresh')" title="__T_CRYPTOBOT_REFRESH__">
                    <span class="msi sm" :class="{ spin: loading }">refresh</span>
                </button>
            </div>
        </section>

        <section class="mt-3">
            <div class="mb-2 flex items-baseline justify-between px-1">
                <h2 class="text-[15px] font-semibold text-ink">__T_CRYPTOBOT_DERIVATIVE_POSITIONS__</h2>
                <span class="text-[11.5px] text-faint">{{ data.positions.length }}</span>
            </div>
            <div v-if="!data.positions.length" class="rounded-2xl border border-line bg-bg-elev py-6 text-center text-[12.5px] text-faint">
                __T_CRYPTOBOT_POSITIONS_EMPTY__
            </div>
            <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
                <li v-for="p in data.positions" :key="p.instId + p.posSide" class="rounded-xl border border-line bg-bg-elev px-4 py-3">
                    <div class="flex items-baseline justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-[14px] font-semibold text-ink">{{ p.instId }}</span>
                            <span class="rounded-md border border-line bg-bg px-1.5 py-px text-[10.5px] font-medium uppercase tracking-wider"
                                :style="{ color: p.posSide === 'long' ? 'var(--color-good)' : (p.posSide === 'short' ? 'var(--color-bad)' : 'var(--color-muted)') }">
                                {{ p.posSide || (p.pos > 0 ? 'long' : 'short') }}
                            </span>
                            <span v-if="p.lever" class="text-[10.5px] text-faint font-mono">{{ p.lever }}x</span>
                        </div>
                        <span class="text-[14px] font-semibold font-mono" :class="p.upl >= 0 ? 'text-good' : 'text-bad'">
                            {{ p.upl >= 0 ? '+' : '' }}{{ fmtNum(p.upl, 2) }}
                            <span class="text-[11px] text-faint">({{ fmtNum(p.uplRatio * 100, 2) }}%)</span>
                        </span>
                    </div>
                    <div class="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 text-[11.5px]">
                        <div class="flex justify-between"><span class="text-muted">__T_CRYPTOBOT_AMOUNT__</span><span class="font-mono text-ink">{{ fmtSmart(p.pos) }}</span></div>
                        <div class="flex justify-between"><span class="text-muted">__T_CRYPTOBOT_ENTRY_PRICE__</span><span class="font-mono text-ink">{{ fmtSmart(p.avgPx) }}</span></div>
                        <div class="flex justify-between"><span class="text-muted">__T_CRYPTOBOT_MARK_PRICE__</span><span class="font-mono text-ink">{{ fmtSmart(p.markPx) }}</span></div>
                    </div>
                </li>
            </ul>
        </section>

        <section v-if="data.balances" class="mt-4">
            <div class="mb-2 flex items-baseline justify-between px-1">
                <h2 class="text-[15px] font-semibold text-ink">__T_CRYPTOBOT_BALANCES__</h2>
                <span class="text-[11.5px] text-faint">{{ data.balances.details.length }}</span>
            </div>
            <div v-if="!data.balances.details.length" class="rounded-2xl border border-line bg-bg-elev py-6 text-center text-[12.5px] text-faint">
                __T_CRYPTOBOT_BALANCES_EMPTY__
            </div>
            <ul v-else class="m-0 flex list-none flex-col gap-1 p-0">
                <li v-for="b in data.balances.details" :key="b.ccy" class="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-bg-hi">
                    <span class="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-bg-hi font-mono text-[10.5px] font-semibold text-ink">{{ b.ccy.slice(0, 4) }}</span>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-baseline justify-between">
                            <span class="text-[14px] font-medium text-ink">{{ b.ccy }}</span>
                            <span class="font-mono text-[12.5px] text-ink">{{ fmtSmart(b.eq) }}</span>
                        </div>
                        <div class="mt-0.5 flex items-baseline justify-between text-[11px] text-muted">
                            <span v-if="b.frozenBal > 0">__T_CRYPTOBOT_FROZEN__ {{ fmtSmart(b.frozenBal) }}</span>
                            <span v-else class="text-faint">__T_CRYPTOBOT_AVAILABLE__ {{ fmtSmart(b.availEq) }}</span>
                            <span class="font-mono">≈ {{ fmtNum(b.eqUsd, 2) }} USD</span>
                        </div>
                    </div>
                </li>
            </ul>
        </section>

        <div v-if="data.balancesError || data.positionsError" class="mt-3 rounded-lg px-3 py-2 text-[12px] text-bad"
            style="background:color-mix(in srgb, var(--color-bad) 10%, transparent)">
            <div v-if="data.balancesError">__T_CRYPTOBOT_BALANCES__: {{ data.balancesError }}</div>
            <div v-if="data.positionsError">__T_CRYPTOBOT_DERIVATIVE_POSITIONS__: {{ data.positionsError }}</div>
        </div>
    </template>
</template>

<style scoped>
.spin { animation: cb-spin 1s linear infinite; }
@keyframes cb-spin { to { transform: rotate(360deg); } }
</style>
