<script setup>
defineProps({
    presets: { type: Array, default: () => [] },
    goalPreset: { type: String, default: 'custom' },
    goal: { type: String, default: '' },
});

defineEmits(['preset', 'update:goal', 'save']);
</script>

<template>
    <div class="mb-3 flex items-start gap-2 rounded-xl px-3.5 py-2 text-[12px] leading-[1.5]"
        style="background:color-mix(in srgb, var(--color-warn) 10%, transparent); color:var(--color-warn)">
        <span class="msi mt-px shrink-0" style="font-size:14px">warning</span>
        <span>__T_CRYPTOBOT_RISK_WARNING_SHORT__</span>
    </div>

    <section class="rounded-2xl border border-line bg-bg-elev p-5">
        <div class="mb-3 text-[13px] font-semibold text-ink">__T_CRYPTOBOT_TRADING_DIRECTIVE__</div>
        <div class="mb-2 flex flex-wrap gap-1.5">
            <button v-for="p in presets" :key="p.key" type="button"
                class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors"
                :class="goalPreset === p.key ? 'border-transparent bg-blue-bg text-blue-fg' : 'border-line-hi bg-transparent text-muted hover:bg-bg-hi hover:text-ink'"
                @click="$emit('preset', p.key)">
                <span class="msi" style="font-size:14px">{{ p.icon }}</span>
                <span>{{ p.label }}</span>
            </button>
        </div>
        <div v-if="goalPreset !== 'custom'" class="rounded-lg border border-line bg-bg px-3 py-2 text-[12.5px] leading-[1.55] text-muted">
            {{ goal }}
        </div>
        <textarea v-else :value="goal" rows="4" placeholder="__T_CRYPTOBOT_TRADING_DIRECTIVE_PLACEHOLDER__"
            class="w-full resize-none rounded-lg border border-line-hi bg-bg px-3 py-2 text-[13px] leading-[1.55] text-ink outline-none placeholder:text-faint focus:border-accent"
            @input="$emit('update:goal', $event.target.value)" />

        <div class="mt-4 flex items-center justify-end">
            <button class="inline-flex items-center gap-1.5 rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-line-hi"
                @click="$emit('save')">
                <span class="msi" style="font-size:14px">check</span>
                <span>__T_CRYPTOBOT_SAVE__</span>
            </button>
        </div>
    </section>
</template>
