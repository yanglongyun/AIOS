<script setup>
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';
</script>

<template>
    <header class="flex h-16 flex-none items-center bg-bg px-4 max-md:h-14 max-md:px-2">
        <span class="w-2 max-md:w-0"></span>
        <div class="ml-3 mr-1 min-w-0 flex-1 truncate text-[20px] font-medium tracking-[-0.01em] text-ink max-md:text-[17px]">
            __T_APP_SYSINFO__
        </div>
        <div class="ml-auto flex items-center gap-1">
            <AskAI />
            <AppHub />
        </div>
    </header>
</template>
