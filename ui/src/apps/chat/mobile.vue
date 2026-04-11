<template>
  <div class="flex h-full w-full flex-col overflow-hidden" style="background:#f5f3ef">
    <div class="flex items-center justify-between border-b px-3 py-2.5" style="border-color:rgba(0,0,0,0.07);background:#ede9e2">
      <button
        class="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all"
        :style="showHistory ? 'border-color:rgba(92,67,50,0.25);background:#fff;color:#3d2f1e' : 'border-color:rgba(92,67,50,0.14);background:rgba(255,255,255,0.55);color:rgba(61,47,30,0.75)'"
        @click="toggleHistory"
      >
        <Menu class="h-4 w-4" />
      </button>
      <div class="text-[15px] font-semibold" style="color:#2a1f13">__T_APP_TOP_CHAT__</div>
      <div class="flex items-center gap-2">
        <button
          class="flex h-[34px] w-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border transition-all"
          style="border-color:rgba(92,67,50,0.14);background:rgba(255,255,255,0.58);color:rgba(61,47,30,0.82)"
          title="__T_CHAT_NEW_TITLE__"
          @click="newChat"
        >
          <Plus class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div v-if="showHistory" class="min-h-0 flex-1 overflow-y-auto px-2 py-2" style="background:#ede9e2">
      <HistoryPanel ref="historyRef" :active-id="currentConversationId" @open-chat="openChatFromHistory" />
    </div>

    <ChatCore
      v-else
      ref="chatRef"
      :conversation-id="currentConversationId"
      :pending-message="pendingMessage"
      :context-label="contextLabel"
      :context-scene="contextScene"
      :quick-messages="quickMessages"
      @conversation-change="onConversationChange"
      @history-change="refreshHistory"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Menu, Plus } from 'lucide-vue-next';
import ChatCore from './chat.vue';
import HistoryPanel from './History.vue';

defineProps({
  pendingMessage: { type: String, default: null }
});

const chatRef = ref(null);
const historyRef = ref(null);
const showHistory = ref(false);
const currentConversationId = ref(null);
const contextLabel = computed(() => '');
const contextScene = computed(() => 'chat');
const quickMessages = computed(() => []);

const toggleHistory = () => {
  showHistory.value = !showHistory.value;
  if (showHistory.value) refreshHistory();
};

const refreshHistory = () => {
  historyRef.value?.fetchChats();
};

const onConversationChange = (conversationId) => {
  currentConversationId.value = conversationId || null;
};

const openChatFromHistory = (chat) => {
  showHistory.value = false;
  currentConversationId.value = chat.conversation_id;
};

const newChat = () => {
  showHistory.value = false;
  currentConversationId.value = null;
  chatRef.value?.newChat();
};
</script>
