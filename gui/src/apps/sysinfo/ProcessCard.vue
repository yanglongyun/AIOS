<script setup>
defineProps({
    processes: { type: Array, default: () => [] }
});
</script>

<template>
    <article class="si-card">
        <header class="mb-3.5 flex items-start justify-between gap-3">
            <div>
                <div class="text-[15.5px] font-medium tracking-[-0.005em] text-ink">进程</div>
                <div class="mt-1 text-[12.5px] leading-[1.55] text-muted">按 CPU 占用排序的前 20 个进程。</div>
            </div>
        </header>

        <div class="flex flex-col">
            <div class="proc-row text-[11px] uppercase tracking-[0.06em] text-faint">
                <span>PID</span><span>CPU%</span><span>内存%</span><span>用户</span><span>命令</span>
            </div>
            <div v-for="p in processes" :key="p.pid"
                 class="proc-row border-b border-line-soft text-[12.5px] transition-colors hover:bg-bg-hi rounded-md">
                <span class="tabular-nums">{{ p.pid }}</span>
                <span class="inline-flex items-center gap-2 tabular-nums">
                    <span class="inline-block h-1 w-[60px] overflow-hidden rounded-sm bg-bg-elev">
                        <span class="block h-full rounded-sm bg-accent"
                              :style="{ width: Math.min(100, p.cpu) + '%' }"></span>
                    </span>
                    {{ p.cpu.toFixed(1) }}
                </span>
                <span class="tabular-nums">{{ p.mem.toFixed(1) }}</span>
                <span class="text-muted">{{ p.user }}</span>
                <span class="truncate font-mono text-ink" :title="p.command">{{ p.command }}</span>
            </div>
        </div>
    </article>
</template>

<style scoped>
.proc-row {
    display: grid;
    grid-template-columns: 80px 130px 80px 100px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    padding: 7px 4px;
}
@media (max-width: 760px) {
    .proc-row {
        grid-template-columns: 60px 100px 60px 80px minmax(0, 1fr);
        font-size: 12px;
    }
}
</style>
