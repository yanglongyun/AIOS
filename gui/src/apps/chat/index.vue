<template>
  <div v-if="detailOpen" class="flex min-h-0 min-w-0 flex-1 flex-col bg-bg text-ink">
    <header class="flex shrink-0 items-center gap-2 px-4 py-3">
      <button class="icon-btn" title="__T_CRYPTOBOT_BACK__" @click="backToList">
        <span class="msi sm">arrow_back</span>
      </button>

      <div class="min-w-0 flex-1">
        <div class="truncate text-[13px] font-medium text-ink">
          {{ currentTitle || (currentConversationId ? '__T_CHAT_UNTITLED__' : '__T_CHAT_NEW_SHORT__') }}
        </div>
        <div v-if="currentConversationId" class="mt-0.5 truncate font-mono text-[10px] text-faint">
          {{ currentConversationId }}
        </div>
      </div>

      <button class="icon-btn" title="__T_CHAT_NEW_CONVERSATION__" @click="newChat">
        <span class="msi sm">edit_square</span>
      </button>

      <div class="relative" ref="moreRef">
        <button class="icon-btn"
          :class="{ '!bg-bg-hi !text-ink': showMore }"
          :disabled="!currentConversationId"
          title="__T_COMMON_MORE__"
          @click="showMore = !showMore">
          <span class="msi sm">more_vert</span>
        </button>
        <div v-if="showMore" class="more-menu">
          <button class="menu-item" @click="renameCurrent">
            <span class="msi sm">edit</span>__T_CHAT_RENAME_TITLE__
          </button>
          <button class="menu-item danger" @click="deleteCurrent">
            <span class="msi sm">delete</span>__T_CHAT_DELETE_TITLE__
          </button>
        </div>
      </div>

      <AppLauncher />
    </header>

    <ChatCore
      ref="chatRef"
      variant="desktop"
      :conversation-id="currentConversationId"
      :pending-message="pendingMessage"
      :intent-request="intentRequest"
      :auto-open-last="false"
      @conversation-change="onConversationChange"
      @history-change="markHistoryDirty"
    />
  </div>

  <div v-else class="flex h-full flex-col bg-bg">
    <header class="flex flex-none items-end justify-between gap-4 px-8 pb-5 pt-7 max-md:px-4 max-md:pb-3 max-md:pt-5">
      <div>
        <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">__T_APP_CHAT__</h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi py-2 pl-3 pr-3.5 text-[13px] font-medium text-muted transition-colors hover:bg-line-hi hover:text-ink"
          @click="newChat">
          <span class="msi sm">edit_square</span>
          <span>__T_CHAT_NEW_CONVERSATION__</span>
        </button>
        <AppLauncher />
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 max-md:px-3 max-md:pb-10">
      <HistoryPanel
        ref="historyRef"
        :active-id="currentConversationId"
        @open-chat="openChatFromHistory" />
    </div>
  </div>
</template>

<script setup>
import AppLauncher from '@/components/AppLauncher.vue';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import HistoryPanel from './History.vue';
import ChatCore from './chat.vue';

const props = defineProps({
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null }
});

const chatRef = ref(null);
const historyRef = ref(null);
const moreRef = ref(null);
const detailOpen = ref(false);
const currentConversationId = ref(null);
const currentTitle = ref('');
const showMore = ref(false);
const historyDirty = ref(false);

const request = async (path, options = {}) => {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    throw new Error(data?.error || `${res.status} ${res.statusText}`);
  }
  return data;
};

async function syncTitle(conversationId) {
  if (!conversationId) { currentTitle.value = ''; return; }
  try {
    const list = await request('/api/chat/list');
    const found = (list || []).find(c => c.conversation_id === conversationId);
    currentTitle.value = found?.title || '';
  } catch {}
}

function markHistoryDirty() {
  historyDirty.value = true;
  historyRef.value?.fetchChats();
}

function onConversationChange(conversationId) {
  const next = conversationId || null;
  currentConversationId.value = next;
  syncTitle(next);
  markHistoryDirty();
}

function openChatFromHistory(chat) {
  currentConversationId.value = chat.conversation_id;
  currentTitle.value = chat.title || '';
  detailOpen.value = true;
  showMore.value = false;
}

function newChat() {
  currentConversationId.value = null;
  currentTitle.value = '';
  showMore.value = false;
  detailOpen.value = true;
  nextTick(() => chatRef.value?.newChat());
}

function backToList() {
  detailOpen.value = false;
  showMore.value = false;
  if (historyDirty.value) {
    nextTick(() => {
      historyRef.value?.fetchChats();
      historyDirty.value = false;
    });
  }
}

async function renameCurrent() {
  showMore.value = false;
  if (!currentConversationId.value) return;
  const next = window.prompt('__T_CHAT_RENAME_PROMPT__', currentTitle.value || '');
  if (next === null) return;
  const title = next.trim();
  if (!title) return;
  try {
    await request('/api/chat/rename', {
      method: 'POST',
      body: JSON.stringify({ conversationId: currentConversationId.value, title }),
    });
    currentTitle.value = title;
    markHistoryDirty();
  } catch (e) {
    window.alert(`__T_COMMON_UPDATE_FAILED__: ${e.message}`);
  }
}

async function deleteCurrent() {
  showMore.value = false;
  if (!currentConversationId.value) return;
  const ok = window.confirm('__T_CHAT_DELETE_CONFIRM__'.replace('{title}', currentTitle.value || '__T_CHAT_UNTITLED__'));
  if (!ok) return;
  try {
    await request('/api/chat/delete', {
      method: 'POST',
      body: JSON.stringify({ conversationId: currentConversationId.value }),
    });
    currentConversationId.value = null;
    currentTitle.value = '';
    detailOpen.value = false;
    markHistoryDirty();
  } catch (e) {
    window.alert('__T_CHAT_DELETE_FAILED__'.replace('{message}', e.message));
  }
}

function onDocPointerDown(e) {
  if (!showMore.value) return;
  if (moreRef.value && !moreRef.value.contains(e.target)) {
    showMore.value = false;
  }
}
function onEscape(e) {
  if (e.key === 'Escape') showMore.value = false;
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown);
  document.addEventListener('keydown', onEscape);
  if (props.pendingMessage || props.intentRequest) {
    detailOpen.value = true;
  }
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
  document.removeEventListener('keydown', onEscape);
});

watch(currentConversationId, (id) => {
  if (id && !currentTitle.value) syncTitle(id);
});
</script>

<style scoped>
.icon-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--color-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.icon-btn:hover:not(:disabled) { background: var(--color-bg-hi); color: var(--color-ink); }
.icon-btn:disabled { opacity: 0.4; cursor: default; }

.more-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: 50;
  min-width: 140px;
  padding: 4px;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow);
}
.menu-item {
  width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: var(--color-ink);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background .12s;
}
.menu-item:hover { background: var(--color-bg-hi); }
.menu-item .msi.sm { font-size: 16px; color: var(--color-muted); }
.menu-item.danger { color: var(--color-bad); }
.menu-item.danger .msi.sm { color: var(--color-bad); }
.menu-item.danger:hover { background: color-mix(in srgb, var(--color-bad) 8%, transparent); }
</style>
