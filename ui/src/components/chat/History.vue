<template>
  <div class="flex flex-col gap-0.5">

    <div v-if="!chats.length" class="py-12 text-center font-['Georgia','PingFang_SC',serif] text-sm text-[#a0907a] dark:text-[#6a5840]">📭 暂无历史对话</div>

    <div
      v-for="c in chats"
      :key="c.conversation_id"
      class="group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#f5ead8] dark:hover:bg-[rgba(200,160,96,0.08)]"
    >
      <!-- 编辑状态 -->
      <template v-if="editingId === c.conversation_id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.conversation_id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.conversation_id)"
          class="min-w-0 flex-1 rounded-lg border border-[#dcd0b8] bg-[#f5ead8] px-2.5 py-1 text-[13px] font-['Georgia','PingFang_SC',serif] text-[#4a3a28] outline-none dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.4)] dark:text-[#d4c0a0]"
        />
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <button @click="$emit('open-chat', c)" class="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left font-['Georgia','PingFang_SC',serif]">
          <div class="truncate text-sm text-[#4a3a28] dark:text-[#d4c0a0]">{{ c.title || c.conversation_id.slice(0, 8) }}</div>
          <div class="mt-0.5 text-[11px] text-[#b8a888] dark:text-[#5a4a38]">{{ c.created_at }}</div>
        </button>

        <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            v-if="deletingId !== c.conversation_id"
            @click.stop="startRename(c)"
            title="重命名"
            class="flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent text-[#b8a888] transition-all hover:bg-[#ece0c8] hover:text-[#5a4a38] dark:text-[#5a4a38] dark:hover:bg-[rgba(200,160,96,0.1)] dark:hover:text-[#c8a060]">
            <Pencil class="h-3.5 w-3.5" />
          </button>
          <span v-if="deletingId === c.conversation_id" class="px-1 text-[11px] font-['Georgia','PingFang_SC',serif] text-[#c04040]">确认删除?</span>
          <button
            @click.stop="confirmDelete(c.conversation_id)"
            :title="deletingId === c.conversation_id ? '点击确认' : '删除'"
            class="flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent text-[#b8a888] transition-all hover:bg-[#ece0c8] hover:text-[#5a4a38] dark:text-[#5a4a38] dark:hover:bg-[rgba(200,160,96,0.1)] dark:hover:text-[#c8a060]"
            :class="deletingId === c.conversation_id ? 'bg-[#c04040] text-white hover:bg-[#c04040] hover:text-white dark:bg-[#c04040] dark:text-white dark:hover:bg-[#c04040] dark:hover:text-white' : ''">
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next';

defineEmits(['open-chat']);

const chats = ref([]);
const editingId = ref(null);
const editTitle = ref('');
const editInput = ref(null);
const deletingId = ref(null);
let deleteTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchChats = async () => {
  chats.value = await request('/api/chat/list');
};

const startRename = (chat) => {
  editingId.value = chat.conversation_id;
  editTitle.value = chat.title || '';
  nextTick(() => editInput.value?.focus());
};

const cancelRename = () => { editingId.value = null; };

const confirmRename = (conversationId) => {
  if (editingId.value !== conversationId) return;
  const title = editTitle.value.trim();
  if (title) {
    request('/api/chat/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, title })
    }).then(fetchChats).catch(() => {});
  }
  editingId.value = null;
};

const confirmDelete = (conversationId) => {
  if (deletingId.value === conversationId) {
    clearTimeout(deleteTimer);
    deletingId.value = null;
    request('/api/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId })
    }).then(fetchChats).catch(() => {});
    return;
  }
  deletingId.value = conversationId;
  deleteTimer = setTimeout(() => { deletingId.value = null; }, 2000);
};

onMounted(fetchChats);
</script>
