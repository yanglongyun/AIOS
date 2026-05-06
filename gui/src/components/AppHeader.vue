<script setup>
// 全局顶栏: ☰ 抽屉触发 + 当前 app 名 + WS 连接状态指示.
import { computed } from 'vue';
import { Menu } from 'lucide-vue-next';
import { useViewStore } from '@/stores/view';
import { wsStatus } from '@/system/ws.js';

const view = useViewStore();

const dotClass = computed(() => ({
    'bg-good shadow-[0_0_8px_color-mix(in_srgb,var(--color-good)_60%,transparent)]':
        wsStatus.value === 'connected',
    'bg-accent animate-status-pulse': wsStatus.value === 'connecting',
    'bg-bad': wsStatus.value === 'disconnected'
}));
const statusText = computed(() => {
    if (wsStatus.value === 'connected')   return '已连接';
    if (wsStatus.value === 'connecting')  return '连接中…';
    return '未连接';
});
const title = computed(() => view.currentApp?.name || 'AIOS');
</script>

<template>
    <header class="safe-top relative z-[90] shrink-0 flex items-center gap-3 border-b border-line bg-bg-elev px-3 py-2.5">
        <button @click="view.toggleDrawer()"
            class="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
            title="菜单" aria-label="菜单">
            <Menu :size="18" :stroke-width="1.8" />
        </button>

        <div class="min-w-0 flex-1">
            <div class="truncate font-serif text-[15px] font-bold tracking-tight text-ink">{{ title }}</div>
        </div>

        <div class="flex min-w-0 items-center gap-2">
            <span class="h-2 w-2 shrink-0 rounded-full" :class="dotClass"></span>
            <span class="truncate text-[12px] text-muted">{{ statusText }}</span>
        </div>
    </header>
</template>

<style scoped>
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
</style>
