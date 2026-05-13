<script setup>
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';
</script>

<template>
    <header class="flex h-16 flex-none items-center bg-[#0b0e15] px-4 text-[#eef0f5] border-b border-[#23262f] max-md:h-14 max-md:px-2">
        <span class="w-2 max-md:w-0"></span>
        <div class="ml-3 mr-1 min-w-0 flex-1 truncate font-mono text-[18px] font-semibold tracking-[0.02em] text-[#eef0f5] max-md:text-[16px]">
            炒币机
        </div>
        <div class="ml-auto flex items-center gap-1 dark-icons">
            <AskAI />
            <AppHub />
        </div>
    </header>
</template>

<style scoped>
.dark-icons :deep(.icon-btn) { color: #a0a4b3; }
.dark-icons :deep(.icon-btn:hover) { background: rgba(255,255,255,0.06); color: #eef0f5; }
.dark-icons :deep(.icon-btn.active) { background: rgba(240,185,11,0.15); color: #f0b90b; }
</style>
