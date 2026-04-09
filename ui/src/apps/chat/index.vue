<template>
  <div class="relative flex min-h-0 min-w-0 flex-1 overflow-hidden" style="background:#f5f3ef">
    <div class="flex w-56 shrink-0 flex-col border-r" style="background:#ede9e2;border-color:rgba(0,0,0,0.07)">
      <div class="border-b px-3 py-2.5" style="border-color:rgba(0,0,0,0.07)">
        <button
          class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[9px] border px-3 py-2 text-[13px] font-semibold transition-all"
          style="border-color:rgba(92,67,50,0.25);background:#fff;color:#3d2f1e"
          @mouseover="$event.currentTarget.style.background='#f5f0ea'"
          @mouseleave="$event.currentTarget.style.background='#fff'"
          @click="newChat"
        >
          <Plus class="h-3.5 w-3.5" />
          __T_CHAT_NEW_TITLE__
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-1.5 py-1.5 [scrollbar-width:thin]">
        <HistoryPanel ref="historyRef" :active-id="currentConversationId" @open-chat="openChatFromHistory" />
      </div>
    </div>

    <ChatCore
      ref="chatRef"
      variant="desktop"
      :conversation-id="currentConversationId"
      :pending-message="pendingMessage"
      :intent-request="intentRequest"
      @conversation-change="onConversationChange"
      @history-change="refreshHistory"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Plus } from 'lucide-vue-next';
import HistoryPanel from './History.vue';
import ChatCore from './chat.vue';

defineProps({
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null }
});

const chatRef = ref(null);
const historyRef = ref(null);
const currentConversationId = ref(null);

const refreshHistory = () => {
  historyRef.value?.fetchChats();
};

const onConversationChange = (conversationId) => {
  currentConversationId.value = conversationId || null;
};

const openChatFromHistory = (chat) => {
  currentConversationId.value = chat.conversation_id;
};

const newChat = () => {
  currentConversationId.value = null;
  chatRef.value?.newChat();
};
</script>
