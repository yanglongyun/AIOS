<script setup>
import { RING_C, pct, ringOffset } from './utils.js';

defineProps({
    usage: { type: Number, default: 0 },
    label: { type: String, required: true },
    // ring stroke 颜色,通过 CSS var 注入
    color: { type: String, default: 'var(--accent)' }
});
</script>

<template>
    <article class="si-card !m-0 flex items-center gap-6 max-md:flex-col max-md:items-stretch">
        <div class="ring-wrap relative h-[140px] w-[140px] flex-none max-md:mx-auto">
            <svg class="block h-full w-full overflow-visible -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e8eaed" stroke-width="8" />
                <circle cx="50" cy="50" r="42"
                        fill="none"
                        stroke-width="8"
                        stroke-linecap="round"
                        :stroke="color"
                        :stroke-dasharray="RING_C"
                        :stroke-dashoffset="ringOffset(usage)"
                        style="transition: stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
                <div class="text-[30px] font-medium leading-[1.05] tracking-[-0.02em]">
                    {{ pct(usage) }}<span class="ml-0.5 text-[16px] text-faint">%</span>
                </div>
                <div class="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-faint">{{ label }}</div>
            </div>
        </div>

        <div class="flex flex-1 min-w-0 flex-col gap-1">
            <slot />
        </div>
    </article>
</template>
