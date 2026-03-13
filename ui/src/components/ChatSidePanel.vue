<template>
  <div class="fixed inset-0 z-[85] max-md:bg-[rgba(22,14,8,0.45)] max-md:backdrop-blur-[1px]" @click.self="$emit('close')">
    <div
      class="absolute bottom-0 right-0 top-12 flex w-[400px] flex-col overflow-hidden rounded-l-xl shadow-[-4px_0_20px_rgba(0,0,0,0.3)] max-md:w-[calc(100%-2.5rem)]">

      <!-- 复用 Chat 组件 -->
      <Chat :conversationId="lastChatId" :context="context" class="min-h-0 flex-1" @created="onCreated" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Chat from './Chat.vue';

defineProps({
  context: { type: String, default: '' }
});
defineEmits(['close']);

const LAST_CHAT_KEY = 'lastConversationId';
const lastChatId = ref(localStorage.getItem(LAST_CHAT_KEY) || null);

const onCreated = (id) => {
  if (id) localStorage.setItem(LAST_CHAT_KEY, String(id));
};
</script>
