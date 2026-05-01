<script setup>
import TradeOrdersPanel from './TradeOrdersPanel.vue';

defineProps({
    instType: { type: String, default: 'ANY' },
    orders: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    error: { type: String, default: '' },
});

defineEmits(['refresh', 'update:instType']);
</script>

<template>
    <section>
        <div class="mb-2 px-1 text-[15px] font-semibold text-ink">__T_CRYPTOBOT_ORDERS__</div>
        <TradeOrdersPanel
            :inst-type="instType"
            :orders="orders"
            :loading="loading"
            :error="error"
            @update:inst-type="$emit('update:instType', $event)"
            @refresh="$emit('refresh')" />
    </section>
</template>
