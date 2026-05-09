<script setup>
import { fmtUptime } from './utils.js';

defineProps({
    sys: { type: Object, default: () => ({}) },
    sinceText: { type: String, default: '' }
});
</script>

<template>
    <header class="si-card flex items-start justify-between gap-4 max-md:flex-col">
        <div class="min-w-0">
            <div class="text-[11.5px] tracking-[0.04em] text-faint">__T_APP_SYSINFO__</div>
            <div class="mt-1 text-[26px] font-medium tracking-[-0.015em] text-ink">{{ sys.hostname || '__T_SYSINFO_LOCALHOST__' }}</div>
            <div class="mt-1.5 flex flex-wrap gap-2 text-[12.5px] text-muted">
                <span>{{ sys.platform }} · {{ sys.arch }}</span>
                <span>·</span>
                <span>__T_SYSINFO_KERNEL__ {{ sys.release }}</span>
                <span>·</span>
                <span>Node {{ sys.nodeVersion }}</span>
            </div>
        </div>
        <div class="text-right max-md:text-left">
            <div class="inline-flex items-center gap-1.5 rounded-full bg-blue-soft px-3 py-1.5 text-[12.5px] font-medium text-blue-fg">
                <span class="msi xxs">schedule</span>
                <span>{{ fmtUptime(sys.uptime) }}</span>
            </div>
            <div class="mt-1.5 text-[11px] text-faint">
                {{ sinceText ? '__T_SYSINFO_UPDATED_PREFIX__' + sinceText : '' }}
            </div>
        </div>
    </header>
</template>
