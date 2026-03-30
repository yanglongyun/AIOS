<template>
  <div class="flex flex-col gap-0.5">

    <div v-if="!chats.length" class="py-12 text-center text-sm text-[#a09080]">__T_HISTORY_EMPTY__</div>

    <div
      v-for="c in chats"
      :key="c.conversation_id"
      class="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
      :class="activeId === c.conversation_id ? 'bg-[rgba(200,160,96,0.15)]' : 'hover:bg-[rgba(200,160,96,0.08)]'"
    >
      <!-- 编辑状态 -->
      <template v-if="editingId === c.conversation_id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.conversation_id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.conversation_id)"
          class="min-w-0 flex-1 rounded-lg border border-[#d4c0a0] bg-white px-2.5 py-1 text-[13px] text-[#4a3a28] outline-none"
        />
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <button @click="$emit('open-chat', c)" class="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left">
          <div class="truncate text-[13px] text-[#4a3a28]">{{ c.title || c.conversation_id.slice(0, 8) }}</div>
          <div class="mt-0.5 text-[11px] text-[#a09080]">{{ c.created_at }}</div>
        </button>

        <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            v-if="deletingId !== c.conversation_id"
            @click.stop="startRename(c)"
            title="__T_HISTORY_RENAME__"
            class="flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent text-[#a09080] transition-all hover:bg-[rgba(200,160,96,0.12)] hover:text-[#8a6a40]">
            <Pencil class="h-3.5 w-3.5" />
          </button>
          <span v-if="deletingId === c.conversation_id" class="px-1 text-[11px] text-[#c04040]">__T_HISTORY_CONFIRM_DELETE__</span>
          <button
            @click.stop="confirmDelete(c.conversation_id)"
            :title="deletingId === c.conversation_id ? '__T_HISTORY_CLICK_CONFIRM__' : '__T_COMMON_DELETE__'"
            class="flex h-7 w-7 items-center justify-center rounded-lg border-none bg-transparent text-[#a09080] transition-all hover:bg-[rgba(200,160,96,0.12)] hover:text-[#8a6a40]"
            :class="deletingId === c.conversation_id ? 'bg-[#c04040] !text-white hover:!bg-[#c04040]' : ''">
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
defineProps({
  activeId: { type: String, default: null }
});
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
  chats.value = await request('/aios/api/chat/list');
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
    request('/aios/api/chat/rename', {
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
    request('/aios/api/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId })
    }).then(fetchChats).catch(() => {});
    return;
  }
  deletingId.value = conversationId;
  deleteTimer = setTimeout(() => { deletingId.value = null; }, 2000);
};

defineExpose({ fetchChats });

onMounted(fetchChats);
</script>
