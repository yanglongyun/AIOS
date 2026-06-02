<script setup>
import { useToastStore } from '@/stores/toast';
const toast = useToastStore();
</script>

<template>
    <div v-if="toast.message"
        class="toast-enter pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-md border border-line bg-bg-elev px-4 py-2 font-mono text-[12px] text-ink shadow-3">
        {{ toast.message }}
    </div>
</template>
