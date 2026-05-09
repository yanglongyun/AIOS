<script setup>
import { diskTone, gb, pct } from './utils.js';

defineProps({
    disks: { type: Array, default: () => [] }
});

const FILL_COLOR = {
    bad:  'bg-bad',
    warn: 'bg-warn',
    mute: 'bg-accent'
};
</script>

<template>
    <article class="si-card">
        <header class="mb-3.5 flex items-start justify-between gap-3">
            <div>
                <div class="text-[15.5px] font-medium tracking-[-0.005em] text-ink">__T_SYSINFO_DISK__</div>
                <div class="mt-1 text-[12.5px] leading-[1.55] text-muted">__T_SYSINFO_DISK_DESC__</div>
            </div>
        </header>

        <div class="flex flex-col gap-3.5">
            <div v-for="d in disks" :key="d.mountPoint">
                <div class="mb-1.5 flex items-baseline gap-3 text-[12.5px]">
                    <span class="font-mono font-medium">{{ d.mountPoint }}</span>
                    <span class="font-mono text-[11.5px] text-faint">{{ d.filesystem }}</span>
                    <span class="ml-auto tabular-nums text-muted">
                        <strong class="font-medium"
                                :class="{
                                    'text-bad': d.capacity > 0.9,
                                    'text-warn': d.capacity > 0.75 && d.capacity <= 0.9,
                                    'text-muted': d.capacity <= 0.75
                                }">{{ pct(d.capacity) }}%</strong>
                        · {{ gb(d.used) }} / {{ gb(d.total) }}
                    </span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-bg-elev">
                    <div class="h-full rounded-full transition-[width] duration-500"
                         :class="FILL_COLOR[diskTone(d.capacity)]"
                         :style="{ width: pct(d.capacity) + '%' }"></div>
                </div>
            </div>
        </div>
    </article>
</template>
