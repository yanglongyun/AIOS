<template>
  <div class="space-y-1">

    <div v-if="!chats.length" class="py-12 text-center text-sm text-neutral-400">暂无历史对话</div>

    <div
      v-for="c in chats"
      :key="c.id"
      class="group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <!-- 编辑状态 -->
      <template v-if="editingId === c.id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.id)"
          class="flex-1 min-w-0 px-2 py-0.5 rounded bg-gray-100 dark:bg-neutral-700 text-sm text-neutral-800 dark:text-neutral-100 outline-none"
        />
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <button @click="$emit('open-chat', c)" class="flex-1 min-w-0 text-left cursor-pointer">
          <div class="text-sm text-neutral-700 dark:text-neutral-200 truncate">{{ c.title || c.id.slice(0, 8) }}</div>
          <div class="text-xs text-neutral-400 mt-0.5">{{ c.created_at }}</div>
        </button>

        <!-- 操作按钮：hover 显示 -->
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            v-if="deletingId !== c.id"
            @click.stop="startRename(c)"
            title="重命名"
            class="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <span v-if="deletingId === c.id" class="text-xs text-red-500 dark:text-red-400 px-1">确认删除?</span>
          <button
            @click.stop="confirmDelete(c.id)"
            :title="deletingId === c.id ? '点击确认' : '删除'"
            class="flex h-6 w-6 items-center justify-center rounded transition-colors cursor-pointer"
            :class="deletingId === c.id
              ? 'bg-red-500 text-white'
              : 'text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-neutral-700'">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';

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
  editingId.value = chat.id;
  editTitle.value = chat.title || '';
  nextTick(() => editInput.value?.focus());
};

const cancelRename = () => { editingId.value = null; };

const confirmRename = (id) => {
  if (editingId.value !== id) return;
  const title = editTitle.value.trim();
  if (title) {
    request('/api/chat/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id, title })
    }).then(fetchChats).catch(() => {});
  }
  editingId.value = null;
};

const confirmDelete = (id) => {
  if (deletingId.value === id) {
    clearTimeout(deleteTimer);
    deletingId.value = null;
    request('/api/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id })
    }).then(fetchChats).catch(() => {});
    return;
  }
  deletingId.value = id;
  deleteTimer = setTimeout(() => { deletingId.value = null; }, 2000);
};

onMounted(fetchChats);
</script>
