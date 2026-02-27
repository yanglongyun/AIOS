<template>
  <nav class="flex flex-col h-full overflow-hidden">

    <div class="flex flex-col flex-1 min-h-0 px-2 py-2">
      <!-- 聊天 -->
      <button @click="goChat"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer shrink-0"
        :class="isChat
          ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        聊天
      </button>

      <!-- 应用区域 -->
      <div class="mt-3 flex flex-col min-h-0 flex-1">
        <div class="px-3 mb-1 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider shrink-0">应用</div>
        <div class="overflow-y-auto flex-1 space-y-0.5">
          <button @click="go('/smartlist')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/smartlist') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            智能列表
          </button>

          <button @click="go('/notebook')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/notebook') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12h6m-6 4h6M8 4h8a2 2 0 012 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z"/>
            </svg>
            记事本
          </button>

          <button @click="go('/finance')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/finance') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z"/>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m12.72-12.72l-1.41 1.41"/>
            </svg>
            记账本
          </button>

          <button @click="go('/files')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/files') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            文件管理器
          </button>
        </div>
      </div>
    </div>

    <!-- 底部：设置 -->
    <div class="border-t border-gray-200 dark:border-neutral-800 p-3 shrink-0">
      <button @click="go('/settings')"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
        :class="is('/settings') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        设置
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['navigate']);
const route = useRoute();
const router = useRouter();

const isChat = computed(() => route.path.startsWith('/chat'));
const is = (path) => route.path === path;

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goChat = async () => {
  emit('navigate');
  const lastId = localStorage.getItem('lastChatId');
  await router.push(lastId ? `/chat/${lastId}` : { path: '/chat', query: { new: String(Date.now()) } });
};
</script>
