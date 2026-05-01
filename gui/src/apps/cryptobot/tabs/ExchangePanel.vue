<script setup>
import MarketTab from './MarketTab.vue';
import PositionsTab from './PositionsTab.vue';
import TradeOrdersPanel from './TradeOrdersPanel.vue';

defineProps({
    exForm: { type: Object, required: true },
    testingEx: { type: Boolean, default: false },
    testResult: { type: Object, default: null },
    positionsData: { type: Object, default: null },
    positionsLoading: { type: Boolean, default: false },
    positionsError: { type: String, default: '' },
    orders: { type: Array, default: () => [] },
    ordersLoading: { type: Boolean, default: false },
    ordersError: { type: String, default: '' },
    orderInstType: { type: String, default: 'ANY' },
    marketItems: { type: Array, default: () => [] },
    marketUpdatedAt: { type: String, default: '' },
    marketLoading: { type: Boolean, default: false },
    marketError: { type: String, default: '' },
});

defineEmits([
    'dirty',
    'test',
    'save',
    'refresh-positions',
    'refresh-orders',
    'update:orderInstType',
    'refresh-market',
]);
</script>

<template>
    <div class="space-y-5">
        <section class="rounded-2xl border border-line bg-bg-elev p-5">
            <div class="mb-2 flex items-baseline justify-between">
                <div class="text-[13px] font-semibold text-ink">__T_CRYPTOBOT_EXCHANGE_CONFIG_TITLE_SHORT__</div>
                <span class="text-[11px] text-faint">OKX</span>
            </div>
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <label class="block">
                    <span class="block text-[11px] font-medium text-muted">__T_CRYPTOBOT_API_KEY__</span>
                    <input v-model="exForm.api_key" type="password" autocomplete="off" placeholder="OKX API Key"
                        class="mt-1 w-full rounded-lg border border-line-hi bg-bg px-3 py-2 font-mono text-[12px] text-ink outline-none focus:border-accent"
                        @input="$emit('dirty')" />
                </label>
                <label class="block">
                    <span class="block text-[11px] font-medium text-muted">__T_CRYPTOBOT_PASSPHRASE__</span>
                    <input v-model="exForm.passphrase" type="password" autocomplete="off" placeholder="OKX Passphrase"
                        class="mt-1 w-full rounded-lg border border-line-hi bg-bg px-3 py-2 font-mono text-[12px] text-ink outline-none focus:border-accent"
                        @input="$emit('dirty')" />
                </label>
                <label class="block sm:col-span-2">
                    <span class="block text-[11px] font-medium text-muted">__T_CRYPTOBOT_API_SECRET__</span>
                    <input v-model="exForm.api_secret" type="password" autocomplete="off" placeholder="OKX API Secret"
                        class="mt-1 w-full rounded-lg border border-line-hi bg-bg px-3 py-2 font-mono text-[12px] text-ink outline-none focus:border-accent"
                        @input="$emit('dirty')" />
                </label>
            </div>

            <div class="mt-4 flex items-center gap-3">
                <button :disabled="testingEx"
                    class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi px-3 py-1.5 text-[12.5px] font-medium text-muted transition-colors hover:bg-line-hi hover:text-ink disabled:cursor-default disabled:opacity-50"
                    @click="$emit('test')">
                    <span class="msi" style="font-size:14px">cable</span>
                    <span>{{ testingEx ? '__T_CRYPTOBOT_TESTING__' : '__T_CRYPTOBOT_TEST_CONNECTION__' }}</span>
                </button>
                <span v-if="testResult" class="text-[12px] font-medium" :class="testResult.ok ? 'text-good' : 'text-bad'">
                    {{ testResult.ok ? '✓ ' + testResult.msg : '✗ ' + testResult.msg }}
                </span>
                <div class="flex-1"></div>
                <button class="inline-flex items-center gap-1.5 rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-line-hi"
                    @click="$emit('save')">
                    <span class="msi" style="font-size:14px">check</span>
                    <span>__T_CRYPTOBOT_SAVE__</span>
                </button>
            </div>
        </section>

        <PositionsTab
            :data="positionsData"
            :loading="positionsLoading"
            :error="positionsError"
            @refresh="$emit('refresh-positions')" />

        <section>
            <div class="mb-2 px-1 text-[15px] font-semibold text-ink">__T_CRYPTOBOT_ORDERS__</div>
            <TradeOrdersPanel
                :inst-type="orderInstType"
                :orders="orders"
                :loading="ordersLoading"
                :error="ordersError"
                @update:inst-type="$emit('update:orderInstType', $event)"
                @refresh="$emit('refresh-orders')" />
        </section>

        <MarketTab
            :items="marketItems"
            :updated-at="marketUpdatedAt"
            :loading="marketLoading"
            :error="marketError"
            @refresh="$emit('refresh-market')" />
    </div>
</template>
