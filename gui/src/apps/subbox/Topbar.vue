<script setup>
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';
</script>

<template>
    <header class="flex h-16 flex-none items-center border-b border-line-soft bg-bg px-4 max-md:h-14 max-md:px-2">
        <span class="w-2 max-md:w-0"></span>
        <div class="ml-3 mr-1 flex min-w-0 flex-1 items-center gap-2">
            <span class="msi xs text-accent">inbox</span>
            <span class="text-[20px] font-medium tracking-[-0.01em] text-ink max-md:text-[17px]">订阅箱</span>
        </div>
        <div class="ml-auto flex items-center gap-1">
            <ChatTrigger />
            <AppsTrigger />
        </div>
    </header>
</template>
