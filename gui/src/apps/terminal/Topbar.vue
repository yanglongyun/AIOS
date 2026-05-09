<script setup>
import { useViewStore } from '@/stores/view.js';
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';

const view = useViewStore();
</script>

<template>
    <header class="flex h-16 flex-none items-center bg-bg px-4 max-md:h-14 max-md:px-2">
        <button class="icon-btn lg"
                :class="{ active: view.appDrawerOpen }"
                title="__T_COMMON_SIDEBAR__"
                @click="view.toggleAppDrawer()">
            <span class="msi">menu</span>
        </button>
        <div class="ml-3 mr-1 min-w-0 flex-1 truncate text-[20px] font-medium tracking-[-0.01em] text-ink max-md:text-[17px]">
            __T_APP_TERMINAL__
        </div>
        <div class="ml-auto flex items-center gap-1">
            <ChatTrigger />
            <AppsTrigger />
        </div>
    </header>
</template>
