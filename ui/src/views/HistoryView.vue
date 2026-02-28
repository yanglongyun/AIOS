<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="w-full max-w-4xl mx-auto">
      <div class="mb-4">
        <h1 class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">历史会话</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">选择一个会话继续对话</p>
      </div>
      <div class="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
        <HistoryPanel @open-chat="openChatFromHistory" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import HistoryPanel from '../components/chat/History.vue';

const router = useRouter();

const openChatFromHistory = async (chat) => {
  await router.push({ path: `/chat/${chat.id}`, query: { title: chat.title || chat.id.slice(0, 8) } });
};
</script>

