<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[640px]">
      <div class="mb-5 flex items-center gap-3">
        <span class="text-[28px]">📜</span>
        <div>
          <h1 class="m-0 text-xl font-bold text-[#4a3a28]">历史会话</h1>
          <p class="mt-0.5 text-xs text-[#a0907a]">选择一个会话继续对话</p>
        </div>
      </div>
      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
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
