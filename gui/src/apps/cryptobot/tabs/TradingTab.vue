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
        <TradeOrdersPanel
            :inst-type="instType"
            :orders="orders"
            :loading="loading"
            :error="error"
            @update:inst-type="$emit('update:instType', $event)"
            @refresh="$emit('refresh')" />
    </section>
</template>
