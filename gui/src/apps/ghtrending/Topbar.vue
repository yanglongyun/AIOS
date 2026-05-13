<script setup>
import { useViewStore } from '@/stores/view.js';
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';

const view = useViewStore();
</script>

<template>
    <header class="flex h-16 flex-none items-center bg-[#0d1117] px-4 max-md:h-14 max-md:px-2">
        <button class="icon-btn lg gh-icon-btn"
                :class="{ 'gh-icon-btn-on': view.appDrawerOpen }"
                title="侧栏"
                @click="view.toggleAppDrawer()">
            <span class="msi">menu</span>
        </button>
        <div class="ml-3 mr-1 flex min-w-0 flex-1 items-center gap-2 truncate text-[18px] font-semibold tracking-wide text-white max-md:text-[15px]">
            <svg class="h-4 w-4 shrink-0 text-white" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            <span class="truncate">开源热榜</span>
        </div>
        <div class="ml-auto flex items-center gap-1 dark-icons">
            <AskAI />
            <AppHub />
        </div>
    </header>
</template>

<style scoped>
.gh-icon-btn { color: #c9d1d9; }
.gh-icon-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.gh-icon-btn-on { background: rgba(255,255,255,0.08); color: #fff; }
.dark-icons :deep(.icon-btn) { color: #c9d1d9; }
.dark-icons :deep(.icon-btn:hover) { background: rgba(255,255,255,0.08); color: #fff; }
.dark-icons :deep(.icon-btn.active) { background: rgba(88,166,255,0.16); color: #58a6ff; }
</style>
