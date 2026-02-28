<template>
  <nav class="flex flex-col h-full overflow-hidden">

    <div class="flex flex-col flex-1 min-h-0 px-2 py-2">
      <!-- 对话：新会话 / 历史会话 -->
      <button @click="goNewSession"
        class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer shrink-0"
        :class="isChatNew
          ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        新会话
      </button>
      <button @click="goHistory"
        class="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer shrink-0"
        :class="isChatHistory
          ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        历史会话
      </button>

      <!-- 应用区域 -->
      <div class="mt-3 flex flex-col min-h-0 flex-1">
        <div class="px-3 mb-1 text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider shrink-0">应用</div>
        <div class="overflow-y-auto flex-1 space-y-0.5">
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

          <button @click="go('/inbox')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/inbox') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 4H9l-3-4H2"/>
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
            收件箱
          </button>

          <button @click="go('/playground')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/playground') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6z"/>
            </svg>
            游乐园
          </button>

          <button @click="go('/mindtree')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="route.path.startsWith('/mindtree') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 4h14a2 2 0 0 1 2 2v12l-4-2-4 2-4-2-4 2V6a2 2 0 0 1 2-2z"/>
              <path d="M9 9h6M9 13h6"/>
            </svg>
            心树
          </button>

          <button @click="go('/writerpad')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="route.path.startsWith('/writerpad') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 4h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              <path d="M14 4v6h6"/>
            </svg>
            写字板
          </button>

          <button @click="go('/lovehouse')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/lovehouse') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            窗口
          </button>

          <button @click="go('/nokia')"
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            :class="is('/nokia') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="7" y="2" width="10" height="20" rx="2"/>
              <line x1="9" y1="18" x2="15" y2="18"/>
              <line x1="12" y1="6" x2="12" y2="6.01"/>
            </svg>
            老手机
          </button>
        </div>
      </div>
    </div>

    <!-- 底部：社区 + 设置 -->
    <div class="border-t border-gray-200 dark:border-neutral-800 p-3 shrink-0">
      <button @click="go('/community')"
        class="mb-1.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
        :class="is('/community') ? 'bg-gray-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800/60'">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3z"/>
          <path d="M8 13c2.21 0 4-1.79 4-4S10.21 5 8 5 4 6.79 4 9s1.79 4 4 4z"/>
          <path d="M16 13c-2.67 0-8 1.34-8 4v2h12v-2c0-2.66-1.33-4-4-4z"/>
          <path d="M8 15c-2.67 0-6 1.34-6 4v1h6"/>
        </svg>
        社区
      </button>

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

const isChatNew = computed(() => route.path.startsWith('/chat'));
const isChatHistory = computed(() => route.path === '/history');
const is = (path) => route.path === path;

const go = (path) => {
  emit('navigate');
  router.push(path);
};

const goNewSession = async () => {
  emit('navigate');
  await router.push({ path: '/chat', query: { new: String(Date.now()) } });
};

const goHistory = async () => {
  emit('navigate');
  await router.push('/history');
};
</script>
