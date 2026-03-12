<template>
  <Chat :conversationId="chatId" @created="onCreated" @not-found="onNotFound" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Chat from '../components/Chat.vue';

const route = useRoute();
const router = useRouter();
const LAST_CHAT_KEY = 'lastConversationId';
const CHAT_INPUT_CACHE_KEY = 'chatInputCache';

const chatId = ref(null);

const saveLastChatId = (id) => { if (id) localStorage.setItem(LAST_CHAT_KEY, String(id)); };

const onCreated = (id) => {
  saveLastChatId(id);
  router.replace({ path: `/chat/${id}` }).catch(() => {});
};

const onNotFound = () => {
  router.replace('/chat');
};

watch(() => route.fullPath, () => {
  if (!route.path.startsWith('/chat')) return;
  const id = route.params.id ? String(route.params.id) : null;
  chatId.value = id;
  if (id) saveLastChatId(id);
}, { immediate: true });
</script>
