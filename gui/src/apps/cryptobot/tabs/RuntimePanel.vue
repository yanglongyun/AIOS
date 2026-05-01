<script setup>
defineProps({
    status: { type: Object, required: true },
    canStart: { type: Boolean, default: false },
    countdownLabel: { type: String, default: '' },
    countdownProgress: { type: Number, default: 0 },
    intervals: { type: Array, default: () => [] },
    sliderIdx: { type: Number, default: 0 },
});

defineEmits(['start', 'stop', 'slider']);
</script>

<template>
    <section class="rounded-2xl border border-line bg-bg-elev px-5 py-4">
        <div class="flex items-center gap-2">
            <span class="text-[13px] font-medium text-ink">
                {{ status.state.running ? (status.state.executing ? '__T_CRYPTOBOT_RUNNING_DECISION__' : '__T_CRYPTOBOT_RUNNING__') : '__T_CRYPTOBOT_STOPPED__' }}
            </span>
            <span class="text-[12px] text-faint">·</span>
            <span class="text-[12px] text-muted">{{ status.state.tick_count || 0 }} __T_CRYPTOBOT_DECISION_COUNT_UNIT__</span>
            <div class="flex-1"></div>
            <button v-if="status.state.running"
                class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi px-3 py-1.5 text-[12.5px] font-medium text-bad transition-colors hover:bg-line-hi"
                @click="$emit('stop')">
                <span class="msi" style="font-size:14px">stop</span>
                <span>__T_CRYPTOBOT_STOP__</span>
            </button>
            <button v-else :disabled="!canStart"
                class="inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:cursor-default disabled:opacity-50"
                :class="canStart ? 'bg-blue-bg text-blue-fg hover:bg-line-hi' : 'bg-bg-hi text-muted'"
                @click="$emit('start')">
                <span class="msi" style="font-size:14px">play_arrow</span>
                <span>__T_CRYPTOBOT_START__</span>
            </button>
        </div>

        <div v-if="status.state.last_error" class="mt-2 rounded-lg px-3 py-2 text-[12px] text-bad"
            style="background:color-mix(in srgb, var(--color-bad) 10%, transparent)">
            {{ status.state.last_error }}
        </div>

        <div class="mt-3">
            <div class="mb-1.5 flex items-center justify-between text-[11.5px]">
                <span class="font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_NEXT_DECISION__</span>
                <span class="font-mono text-[12px] font-medium text-ink">{{ countdownLabel }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-bg-hi">
                <div class="h-full rounded-full transition-all duration-1000"
                    :style="{ width: countdownProgress + '%', background: status.state.running ? 'var(--color-good)' : 'var(--color-line-hi)' }"></div>
            </div>
        </div>

        <div class="mt-4">
            <div class="mb-1.5 flex items-baseline justify-between">
                <span class="text-[11.5px] font-medium uppercase tracking-wider text-faint">__T_CRYPTOBOT_CYCLE_TITLE__</span>
                <span class="text-[14px] font-medium text-ink">{{ intervals[sliderIdx] }} <span class="text-[11px] text-muted">__T_CRYPTOBOT_MIN_UNIT__</span></span>
            </div>
            <input type="range" min="0" :max="intervals.length - 1" step="1"
                :value="sliderIdx" @input="$emit('slider', $event.target.value)" class="cb-slider w-full" />
            <div class="mt-1 flex justify-between text-[10.5px]">
                <span v-for="(m, i) in intervals" :key="m"
                    class="cursor-pointer transition-colors"
                    :class="i === sliderIdx ? 'font-semibold text-ink' : 'text-faint hover:text-muted'"
                    @click="$emit('slider', i)">{{ m }}</span>
            </div>
        </div>
    </section>

</template>

<style scoped>
.cb-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: var(--color-line-hi);
    border-radius: 9999px;
    outline: none;
    cursor: pointer;
}
.cb-slider:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; }
.cb-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px; height: 18px;
    border-radius: 9999px;
    background: var(--color-accent);
    border: 3px solid var(--color-bg);
    box-shadow: 0 0 0 1px var(--color-accent);
    cursor: pointer;
}
.cb-slider::-moz-range-thumb {
    width: 18px; height: 18px;
    border-radius: 9999px;
    background: var(--color-accent);
    border: 3px solid var(--color-bg);
    box-shadow: 0 0 0 1px var(--color-accent);
    cursor: pointer;
}
</style>
