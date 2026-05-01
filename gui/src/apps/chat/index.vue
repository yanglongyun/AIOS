<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col bg-bg text-ink">
    <!-- Top bar -->
    <header class="flex shrink-0 items-center gap-1 bg-transparent px-3 py-2">
      <!-- 标题(显示当前对话标题,新会话占位)-->
      <div class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
        {{ currentTitle || (currentConversationId ? '未命名对话' : '新会话') }}
      </div>

      <!-- 新建 -->
      <button class="icon-btn" title="新建会话" @click="newChat">
        <span class="msi sm">edit_square</span>
      </button>

      <!-- 历史 -->
      <button class="icon-btn" title="历史会话" @click="showHistory = true">
        <span class="msi sm">history</span>
      </button>

      <!-- 更多(三点)-->
      <div class="relative" ref="moreRef">
        <button class="icon-btn"
          :class="{ '!bg-bg-hi !text-ink': showMore }"
          :disabled="!currentConversationId"
          title="更多"
          @click="showMore = !showMore">
          <span class="msi sm">more_vert</span>
        </button>
        <div v-if="showMore" class="more-menu">
          <button class="menu-item" @click="renameCurrent">
            <span class="msi sm">edit</span>修改标题
          </button>
          <button class="menu-item danger" @click="deleteCurrent">
            <span class="msi sm">delete</span>删除对话
          </button>
        </div>
      </div>
    </header>

    <!-- Chat body -->
    <ChatCore
      ref="chatRef"
      variant="desktop"
      :conversation-id="currentConversationId"
      :pending-message="pendingMessage"
      :intent-request="intentRequest"
      @conversation-change="onConversationChange"
      @history-change="refreshHistory"
    />

    <!-- History modal -->
    <div v-if="showHistory"
      class="fixed inset-0 z-40 flex items-center justify-center p-4"
      @click.self="showHistory = false">
      <div class="fade-enter absolute inset-0 bg-ink/40 backdrop-blur-[2px]"></div>
      <div class="relative z-10 flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-line bg-bg-elev shadow-card-lg">
        <div class="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div class="text-[14px] font-semibold text-ink">历史会话</div>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-bg-hi hover:text-ink"
            @click="showHistory = false">
            <span class="msi sm">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <HistoryPanel ref="historyRef"
            :active-id="currentConversationId"
            @open-chat="openChatFromHistory" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import HistoryPanel from './History.vue';
import ChatCore from './chat.vue';

defineProps({
  pendingMessage: { type: String, default: null },
  intentRequest: { type: Object, default: null }
});

const chatRef = ref(null);
const historyRef = ref(null);
const moreRef = ref(null);
const currentConversationId = ref(null);
const currentTitle = ref('');
const showHistory = ref(false);
const showMore = ref(false);

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

// 切换会话时,从 chat 列表里同步标题(因为后端创建新会话默认 title="新对话")
async function syncTitle(conversationId) {
  if (!conversationId) { currentTitle.value = ''; return; }
  try {
    const list = await request('/api/chat/list');
    const found = (list || []).find(c => c.conversation_id === conversationId);
    currentTitle.value = found?.title || '';
  } catch { /* keep current */ }
}

function refreshHistory() {
  historyRef.value?.fetchChats();
}

function onConversationChange(conversationId) {
  const next = conversationId || null;
  currentConversationId.value = next;
  syncTitle(next);
}

function openChatFromHistory(chat) {
  currentConversationId.value = chat.conversation_id;
  currentTitle.value = chat.title || '';
  showHistory.value = false;
  showMore.value = false;
}

function newChat() {
  currentConversationId.value = null;
  currentTitle.value = '';
  showMore.value = false;
  chatRef.value?.newChat();
}

async function renameCurrent() {
  showMore.value = false;
  if (!currentConversationId.value) return;
  const next = window.prompt('修改对话标题', currentTitle.value || '');
  if (next === null) return;
  const title = next.trim();
  if (!title) return;
  try {
    await request('/api/chat/rename', {
      method: 'POST',
      body: JSON.stringify({ conversationId: currentConversationId.value, title }),
    });
    currentTitle.value = title;
    refreshHistory();
  } catch (e) {
    window.alert('修改失败:' + e.message);
  }
}

async function deleteCurrent() {
  showMore.value = false;
  if (!currentConversationId.value) return;
  const ok = window.confirm(`删除对话"${currentTitle.value || '未命名'}"?此操作不可撤销。`);
  if (!ok) return;
  try {
    await request('/api/chat/delete', {
      method: 'POST',
      body: JSON.stringify({ conversationId: currentConversationId.value }),
    });
    currentConversationId.value = null;
    currentTitle.value = '';
    chatRef.value?.newChat();
    refreshHistory();
  } catch (e) {
    window.alert('删除失败:' + e.message);
  }
}

// 点击菜单外部关闭
function onDocPointerDown(e) {
  if (!showMore.value) return;
  if (moreRef.value && !moreRef.value.contains(e.target)) {
    showMore.value = false;
  }
}
function onEscape(e) {
  if (e.key === 'Escape') {
    showMore.value = false;
    showHistory.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown);
  document.addEventListener('keydown', onEscape);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown);
  document.removeEventListener('keydown', onEscape);
});

// 当 conversationId 由 chat.vue 推过来时,如果还没标题就再 sync 一次(WS 创建会话有微小延迟)
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

/* 三点菜单弹层 */
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
