<script setup>
import { useToastStore } from '@/stores/toast';
const toast = useToastStore();
</script>

<template>
    <div v-if="toast.message"
        class="toast-enter fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 bg-card border border-line text-ink text-sm rounded-xl shadow-[0_0_0_1px_rgba(0,215,255,0.14),0_18px_52px_rgba(0,7,20,0.55)] z-50 pointer-events-none">
        {{ toast.message }}
    </div>
</template>
