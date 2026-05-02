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
        <span class="msi text-faint" style="font-size:30px">hourglass_empty</span>
        <div class="text-[14px]">__T_CRYPTOBOT_LOADING__</div>
    </div>
    <div v-else-if="error" class="rounded-md px-3 py-2 text-[13px] text-bad"
        style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
        {{ error }}
    </div>
    <template v-else-if="data">
        <!-- Total balance card -->
        <section v-if="data.balances" class="overflow-hidden rounded-md border border-line bg-bg-elev px-4 py-3">
            <div class="flex items-baseline justify-between gap-3">
                <div class="min-w-0">
                    <div class="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_EQUITY_TOTAL__</div>
                    <div class="mt-1 flex items-baseline gap-2">
                        <span class="font-mono text-[26px] font-bold leading-none tabular-nums text-ink">{{ fmtNum(data.balances.totalEq, 2) }}</span>
                        <span class="text-[11px] font-semibold tracking-[0.06em] text-faint">USDT</span>
                    </div>
                </div>
                <button class="grid h-7 w-7 cursor-pointer place-items-center rounded-md border-0 bg-bg-hi text-muted hover:bg-line-hi hover:text-ink"
                    @click="$emit('refresh')" :title="'__T_COMMON_REFRESH__'">
                    <span class="msi" :class="{ spin: loading }" style="font-size:14px">refresh</span>
                </button>
            </div>
        </section>

        <!-- Positions -->
        <section class="mt-3">
            <div class="mb-1.5 flex items-baseline gap-2 px-1">
                <h2 class="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_DERIVATIVE_POSITIONS__</h2>
                <span class="font-mono text-[11px] tabular-nums text-muted">{{ data.positions.length }}</span>
            </div>
            <div v-if="!data.positions.length" class="rounded-md border border-line bg-bg-elev py-6 text-center text-[12.5px] text-faint">
                __T_CRYPTOBOT_POSITIONS_EMPTY__
            </div>
            <div v-else class="overflow-hidden rounded-md border border-line bg-bg-elev">
                <div class="divide-y divide-line">
                    <article v-for="p in data.positions" :key="p.instId + p.posSide"
                        class="position-row relative px-4 py-2.5 transition-colors hover:bg-bg-hi"
                        :class="p.posSide === 'long' ? 'is-long' : 'is-short'">
                        <div class="flex items-baseline justify-between gap-3">
                            <div class="flex items-center gap-2 min-w-0">
                                <span class="font-mono text-[13px] font-semibold text-ink">{{ p.instId }}</span>
                                <span class="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]"
                                    :class="p.posSide === 'long'
                                        ? 'bg-[color-mix(in_srgb,var(--color-good)_18%,transparent)] text-good'
                                        : 'bg-[color-mix(in_srgb,var(--color-bad)_18%,transparent)] text-bad'">
                                    {{ p.posSide || (p.pos > 0 ? 'long' : 'short') }}
                                </span>
                                <span v-if="p.lever" class="font-mono text-[11px] font-semibold text-accent">{{ p.lever }}x</span>
                            </div>
                            <div class="text-right font-mono tabular-nums" :class="p.upl >= 0 ? 'text-good' : 'text-bad'">
                                <span class="text-[14px] font-bold">{{ p.upl >= 0 ? '+' : '' }}{{ fmtNum(p.upl, 2) }}</span>
                                <span class="ml-1 text-[10.5px] opacity-80">({{ p.upl >= 0 ? '+' : '' }}{{ fmtNum(p.uplRatio * 100, 2) }}%)</span>
                            </div>
                        </div>
                        <div class="mt-1.5 grid grid-cols-3 gap-x-3 font-mono text-[11px] tabular-nums">
                            <div class="flex justify-between">
                                <span class="text-faint">__T_CRYPTOBOT_AMOUNT__</span>
                                <span class="text-ink">{{ fmtSmart(p.pos) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-faint">__T_CRYPTOBOT_ENTRY_PRICE__</span>
                                <span class="text-ink">{{ fmtSmart(p.avgPx) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-faint">__T_CRYPTOBOT_MARK_PRICE__</span>
                                <span class="text-ink">{{ fmtSmart(p.markPx) }}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </div>
        </section>

        <!-- Balances -->
        <section v-if="data.balances" class="mt-3">
            <div class="mb-1.5 flex items-baseline gap-2 px-1">
                <h2 class="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">__T_CRYPTOBOT_BALANCES__</h2>
                <span class="font-mono text-[11px] tabular-nums text-muted">{{ data.balances.details.length }}</span>
            </div>
            <div v-if="!data.balances.details.length" class="rounded-md border border-line bg-bg-elev py-6 text-center text-[12.5px] text-faint">
                __T_CRYPTOBOT_BALANCES_EMPTY__
            </div>
            <div v-else class="overflow-hidden rounded-md border border-line bg-bg-elev">
                <div class="divide-y divide-line">
                    <div v-for="b in data.balances.details" :key="b.ccy"
                        class="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-hi">
                        <span class="grid h-7 w-7 flex-none place-items-center rounded-full bg-bg-hi font-mono text-[10px] font-bold text-ink">
                            {{ b.ccy.slice(0, 4) }}
                        </span>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-baseline justify-between">
                                <span class="font-mono text-[13px] font-semibold text-ink">{{ b.ccy }}</span>
                                <span class="font-mono text-[12.5px] tabular-nums text-ink">{{ fmtSmart(b.eq) }}</span>
                            </div>
                            <div class="mt-0.5 flex items-baseline justify-between font-mono text-[10.5px] tabular-nums">
                                <span v-if="b.frozenBal > 0" class="text-bad">__T_CRYPTOBOT_FROZEN__ {{ fmtSmart(b.frozenBal) }}</span>
                                <span v-else class="text-faint">__T_CRYPTOBOT_AVAILABLE__ {{ fmtSmart(b.availEq) }}</span>
                                <span class="text-muted">≈ {{ fmtNum(b.eqUsd, 2) }} USD</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <div v-if="data.balancesError || data.positionsError" class="mt-3 rounded-md px-3 py-2 text-[12px] text-bad"
            style="background:color-mix(in srgb, var(--color-bad) 10%, transparent)">
            <div v-if="data.balancesError">__T_CRYPTOBOT_BALANCES__: {{ data.balancesError }}</div>
            <div v-if="data.positionsError">__T_CRYPTOBOT_DERIVATIVE_POSITIONS__: {{ data.positionsError }}</div>
        </div>
    </template>
</template>

<style scoped>
.position-row.is-long  { box-shadow: inset 3px 0 0 0 var(--color-good); }
.position-row.is-short { box-shadow: inset 3px 0 0 0 var(--color-bad);  }

.spin { animation: cb-spin 1s linear infinite; }
@keyframes cb-spin { to { transform: rotate(360deg); } }
</style>
