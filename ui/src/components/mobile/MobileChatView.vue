<template>
  <!-- 对话列表 -->
  <div v-if="!currentChat" class="flex h-full flex-col bg-[#1a1410]">
    <!-- 新建按钮 -->
    <div class="shrink-0 border-b border-[#2a1e14] px-4 py-3">
      <button
        @click="newChat"
        class="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#2a1e14] py-2.5 text-[13px] text-[#c8a060] transition-colors active:bg-[#3a2a1c]"
      >
        <span class="text-[16px] leading-none">+</span>
        {{ t('chat_new_title') }}
      </button>
    </div>

    <!-- 对话列表 -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <div v-if="!chats.length" class="py-16 text-center text-[13px] text-[#5a4a38]">{{ t('history_empty') }}</div>
      <button
        v-for="c in chats"
        :key="c.conversation_id"
        class="flex w-full items-center gap-3 border-b border-[#2a1e14] px-4 py-3.5 text-left transition-colors active:bg-[#2a1e14]"
        @click="openChat(c)"
      >
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a1e14] text-[18px]">💬</div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[14px] text-[#d4c0a0]">{{ c.title || c.conversation_id.slice(0, 12) }}</div>
          <div class="mt-0.5 text-[11px] text-[#5a4a38]">{{ c.created_at }}</div>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#4a3a28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>

  <!-- 聊天面板 -->
  <MobileChatPanel v-else :conversation-id="currentChat.conversation_id" />
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import MobileChatPanel from './MobileChatPanel.vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
const setMobileNav = inject('mobileNav');

const chats = ref([]);
const currentChat = ref(null);

const fetchChats = async () => {
  const res = await fetch('/aios/api/chat/list', { credentials: 'include' });
  chats.value = await res.json().catch(() => []);
};

function openChat(c) {
  currentChat.value = c;
  setMobileNav(c.title || c.conversation_id.slice(0, 12), () => {
    currentChat.value = null;
    setMobileNav(null, null);
  });
}

async function newChat() {
  const res = await fetch('/aios/api/chat/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title: t('chat_new_title') })
  });
  const data = await res.json().catch(() => ({}));
  if (!data.conversationId) return;
  const c = { conversation_id: data.conversationId, title: t('chat_new_title') };
  openChat(c);
}

onMounted(fetchChats);
</script>
