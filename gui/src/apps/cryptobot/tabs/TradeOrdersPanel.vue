<script setup>
import { ref, watch } from 'vue';
import { fmtMs, fmtSmart } from '../formatters';

const props = defineProps({
    orders: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
    instType: { type: String, default: 'ANY' },
});

const emit = defineEmits(['refresh', 'update:instType']);

const currentType = ref(props.instType);
watch(() => props.instType, (value) => { currentType.value = value; });

const setType = (value) => {
    currentType.value = value;
    emit('update:instType', value);
    emit('refresh');
};

const orderSideColor = (side) => {
    if (side === 'buy') return 'var(--color-good)';
    if (side === 'sell') return 'var(--color-bad)';
    return 'var(--color-muted)';
};

const orderStateLabel = (s) => {
    if (s === 'filled') return '__T_CRYPTOBOT_ORDER_STATE_FILLED__';
    if (s === 'partially_filled') return '__T_CRYPTOBOT_ORDER_STATE_PARTIAL__';
    if (s === 'live') return '__T_CRYPTOBOT_ORDER_STATE_LIVE__';
    if (s === 'canceled') return '__T_CRYPTOBOT_ORDER_STATE_CANCELED__';
    if (s === 'mmp_canceled') return '__T_CRYPTOBOT_ORDER_STATE_RISK_CANCELED__';
    return s || '—';
};
</script>

<template>
    <div class="mb-2 flex items-center gap-2 px-1">
        <span class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_TYPE__</span>
        <div class="inline-flex rounded-full bg-bg-hi p-0.5">
            <button v-for="t in [
                { k: 'ANY',     l: '__T_CRYPTOBOT_ORDER_TYPE_ALL__' },
                { k: 'SPOT',    l: '__T_CRYPTOBOT_ORDER_TYPE_SPOT__' },
                { k: 'SWAP',    l: '__T_CRYPTOBOT_ORDER_TYPE_SWAP__' },
                { k: 'FUTURES', l: '__T_CRYPTOBOT_ORDER_TYPE_FUTURES__' },
                { k: 'MARGIN',  l: '__T_CRYPTOBOT_ORDER_TYPE_MARGIN__' },
            ]" :key="t.k"
                class="cursor-pointer rounded-full border-0 px-3 py-1 text-[11.5px] transition-colors"
                :class="currentType === t.k ? 'bg-blue-bg text-blue-fg' : 'bg-transparent text-muted hover:text-ink'"
                @click="setType(t.k)">
                {{ t.l }}
            </button>
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
    <div v-else-if="loading && !orders.length" class="flex flex-col items-center gap-2 py-15 text-muted">
        <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
        <div class="text-[14px]">__T_CRYPTOBOT_LOADING__</div>
    </div>
    <div v-else-if="!orders.length" class="rounded-2xl border border-line bg-bg-elev py-12 text-center text-[12.5px] text-faint">
        __T_CRYPTOBOT_ORDERS_EMPTY__
    </div>
    <ul v-else class="m-0 flex list-none flex-col gap-1 p-0">
        <li v-for="o in orders" :key="o.ordId" class="rounded-xl px-4 py-3 transition-colors hover:bg-bg-hi">
            <div class="flex items-baseline justify-between">
                <div class="flex items-center gap-2">
                    <span class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wider"
                        :style="{ color: orderSideColor(o.side) }">
                        {{ o.side === 'buy' ? '__T_CRYPTOBOT_BUY__' : (o.side === 'sell' ? '__T_CRYPTOBOT_SELL__' : o.side) }}
                    </span>
                    <span class="text-[14px] font-medium text-ink">{{ o.instId }}</span>
                    <span class="text-[10.5px] text-faint">{{ o.ordType }}</span>
                </div>
                <span class="text-[11.5px]"
                    :style="{ color: o.state === 'filled' ? 'var(--color-good)' : (o.state === 'canceled' ? 'var(--color-faint)' : 'var(--color-muted)') }">
                    {{ orderStateLabel(o.state) }}
                </span>
            </div>
            <div class="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11.5px] sm:grid-cols-4">
                <div class="flex justify-between sm:block">
                    <span class="text-faint sm:block sm:text-[10px] sm:uppercase sm:tracking-wider">__T_CRYPTOBOT_AMOUNT__</span>
                    <span class="font-mono text-ink">{{ fmtSmart(o.sz) }}</span>
                </div>
                <div class="flex justify-between sm:block">
                    <span class="text-faint sm:block sm:text-[10px] sm:uppercase sm:tracking-wider">__T_CRYPTOBOT_FILLED__</span>
                    <span class="font-mono text-ink">{{ fmtSmart(o.fillSz) }}</span>
                </div>
                <div class="flex justify-between sm:block">
                    <span class="text-faint sm:block sm:text-[10px] sm:uppercase sm:tracking-wider">__T_CRYPTOBOT_AVG_PRICE__</span>
                    <span class="font-mono text-ink">{{ fmtSmart(o.avgPx || o.px) }}</span>
                </div>
                <div class="flex justify-between sm:block">
                    <span class="text-faint sm:block sm:text-[10px] sm:uppercase sm:tracking-wider">__T_CRYPTOBOT_FEE__</span>
                    <span class="font-mono text-ink">{{ fmtSmart(o.fee) }} <span class="text-faint">{{ o.feeCcy }}</span></span>
                </div>
            </div>
            <div class="mt-1 flex items-center gap-2 text-[10.5px] text-faint">
                <span class="font-mono">{{ o.ordId }}</span>
                <span>·</span>
                <span>{{ fmtMs(o.cTime) }}</span>
            </div>
        </li>
    </ul>
</template>

<style scoped>
.spin { animation: cb-spin 1s linear infinite; }
@keyframes cb-spin { to { transform: rotate(360deg); } }
</style>
