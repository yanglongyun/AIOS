<script setup>
import { useNoticeStore } from '@/stores/notice';
const notice = useNoticeStore();
</script>

<template>
    <div v-if="notice.message"
        class="notice-enter fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 bg-zinc-800/95 border border-zinc-700 text-zinc-100 text-sm rounded-lg shadow-2xl z-50 pointer-events-none">
        {{ notice.message }}
    </div>
</template>
