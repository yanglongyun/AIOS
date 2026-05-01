<script setup>
import ExchangePanel from './ExchangePanel.vue';
import RuntimePanel from './RuntimePanel.vue';
import TradingDirectivePanel from './TradingDirectivePanel.vue';

defineProps({
    exForm: { type: Object, required: true },
    testingEx: { type: Boolean, default: false },
    testResult: { type: Object, default: null },
    presets: { type: Array, default: () => [] },
    goalPreset: { type: String, default: 'custom' },
    goal: { type: String, default: '' },
    status: { type: Object, required: true },
    canStart: { type: Boolean, default: false },
    countdownLabel: { type: String, default: '' },
    countdownProgress: { type: Number, default: 0 },
    intervals: { type: Array, default: () => [] },
    sliderIdx: { type: Number, default: 0 },
});

defineEmits([
    'dirty',
    'test-exchange',
    'save',
    'preset',
    'update:goal',
    'start',
    'stop',
    'slider',
]);
</script>

<template>
    <div class="space-y-5">
        <ExchangePanel
            :ex-form="exForm"
            :testing-ex="testingEx"
            :test-result="testResult"
            @dirty="$emit('dirty')"
            @test="$emit('test-exchange')"
            @save="$emit('save')" />

        <TradingDirectivePanel
            :presets="presets"
            :goal-preset="goalPreset"
            :goal="goal"
            @preset="$emit('preset', $event)"
            @update:goal="$emit('update:goal', $event)"
            @save="$emit('save')" />

        <RuntimePanel
            :status="status"
            :can-start="canStart"
            :countdown-label="countdownLabel"
            :countdown-progress="countdownProgress"
            :intervals="intervals"
            :slider-idx="sliderIdx"
            @start="$emit('start')"
            @stop="$emit('stop')"
            @slider="$emit('slider', $event)" />
    </div>
</template>
