<script setup>
import { useRouter } from 'vue-router';
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';

const router = useRouter();
</script>

<template>
    <header class="flex h-16 flex-none items-center border-b border-[#dfe3e8] bg-[#fbfcfd] px-4 max-md:h-14 max-md:px-2">
        <span class="w-2 max-md:w-0"></span>
        <div class="ml-3 mr-1 min-w-0 flex-1 truncate text-[19px] font-semibold tracking-[0.01em] text-[#17202a] max-md:text-[16px]">
            长片工坊
        </div>
        <div class="ml-auto flex items-center gap-1">
            <button class="icon-btn" title="设置" @click="router.push('/app/longvideo/settings')">
                <span class="msi">settings</span>
            </button>
            <AskAI />
            <AppHub />
        </div>
    </header>
</template>
