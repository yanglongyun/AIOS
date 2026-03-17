<template>
  <nav class="flex h-full flex-col overflow-hidden bg-transparent font-['Georgia','PingFang_SC',serif]">
    <div class="space-y-0.5 px-3 pb-2 pt-4">
      <div class="relative flex w-full items-center rounded-lg text-[13px] transition-all duration-150"
        :class="btnClass(isChatNew)">
        <button @click="goLastChat" class="flex flex-1 items-center gap-2 px-3 py-2">
          <span
            class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">✦</span>
          {{ t('app_sidebar_chat') }}
        </button>
        <button @click="goNewSession" :title="t('app_sidebar_new_chat')"
          class="mr-2 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/10 text-[#8a7050] transition-all hover:bg-white/20 hover:text-[#e0c8a0]">
          <Plus class="h-3 w-3" />
        </button>
      </div>
      <button @click="goHistory"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(isChatHistory)">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">◷</span>
        {{ t('app_sidebar_history') }}
      </button>
      <button @click="go('/tasks')"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(is('/tasks'))">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📋</span>
        {{ t('app_sidebar_tasks') }}
      </button>
      <button @click="go('/files')"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(is('/files'))">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">📁</span>
        {{ t('app_sidebar_files') }}
      </button>
      <button @click="go('/skills')"
        class="relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-150"
        :class="btnClass(is('/skills'))">
        <span
          class="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/5 text-[11px]">🎯</span>
        {{ t('app_sidebar_skills') }}
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import { useI18n } from '../i18n/index.js';
const emit = defineEmits(['navigate']);
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const isChatNew = computed(() => route.path.startsWith('/chat'));
const isChatHistory = computed(() => route.path === '/history');
const is = (path) => route.path === path;

const btnClass = (active) => active
  ? 'bg-[rgba(200,160,100,0.15)] text-[#e8d0a8] shadow-[inset_3px_0_0_0_#c8a060]'
  : 'text-[#b8a080] hover:bg-white/5 hover:text-[#e0c8a0]';

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goNewSession = async () => {
  emit('navigate');
  await router.push('/chat');
};

const goLastChat = async () => {
  emit('navigate');
  const lastId = localStorage.getItem('lastConversationId');
  if (lastId) {
    await router.push(`/chat/${lastId}`);
  } else {
    await router.push('/chat');
  }
};

const goHistory = async () => {
  emit('navigate');
  await router.push('/history');
};
</script>
