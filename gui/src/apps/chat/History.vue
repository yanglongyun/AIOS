<template>
  <div class="flex flex-col gap-1.5">

    <div v-if="!chats.length" class="py-12 text-center text-[13px] text-faint">__T_CHAT_EMPTY_HISTORY__</div>

    <div
      v-for="c in chats"
      :key="c.conversation_id"
      class="chat-row group flex cursor-pointer items-start gap-3.5 rounded-[14px] bg-card px-4 py-3 transition-colors hover:bg-card-hi max-md:gap-2.5 max-md:rounded-xl max-md:px-3.5 max-md:py-3"
      :class="{ active: activeId === c.conversation_id, pinned: c.pinned, running: c.state === 'running' }"
    >
      <template v-if="editingId === c.conversation_id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.conversation_id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.conversation_id)"
          class="min-w-0 flex-1 rounded-[8px] border border-line-hi bg-bg px-2.5 py-1 text-[13px] text-ink outline-none focus:border-accent" />
      </template>

      <template v-else>
        <span class="mt-[7px] h-2 w-2 flex-none rounded-full"
          :class="{ 'animate-status-pulse': c.state === 'running' }"
          :style="{ background: c.state === 'running' ? 'var(--color-good)' : (c.pinned ? 'var(--color-accent)' : 'var(--color-faint)') }"></span>

        <button @click="$emit('open-chat', c)" class="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left">
          <div class="flex min-w-0 items-baseline gap-3 max-md:flex-wrap">
            <div class="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{{ c.title || c.conversation_id.slice(0, 8) }}</div>
            <span class="flex-none text-[12px] text-faint">{{ fmtTime(c.created_at) }}</span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-[12px] text-muted">
            <span v-if="c.pinned" class="rounded-md border border-line bg-bg-elev px-1.5 py-px text-[11px] font-medium text-ink">
              __T_CHAT_PIN__
            </span>
            <span v-if="c.state === 'running'" class="font-medium text-good">__T_CHAT_BUSY_PLACEHOLDER__</span>
          </div>
        </button>

        <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
          <button
            v-if="deletingId !== c.conversation_id"
            @click.stop="togglePinned(c)"
            :title="c.pinned ? '__T_CHAT_UNPIN__' : '__T_CHAT_PIN__'"
            class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg hover:text-accent"
            :class="{ '!text-accent': c.pinned }">
            <Pin :size="15" :stroke-width="1.8" :fill="c.pinned ? 'currentColor' : 'none'" />
          </button>
          <button
            v-if="deletingId !== c.conversation_id"
            @click.stop="startRename(c)"
            :title="'__T_NOTEBOOK_RENAME__'"
            class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg hover:text-ink">
            <Pencil :size="15" :stroke-width="1.8" />
          </button>
          <span v-if="deletingId === c.conversation_id" class="px-1.5 text-[11px] font-medium text-bad">__T_CHAT_DELETE_CONFIRM_SHORT__</span>
          <button
            @click.stop="confirmDelete(c.conversation_id)"
            :title="deletingId === c.conversation_id ? '__T_CHAT_DELETE_CONFIRM_CLICK__' : '__T_COMMON_DELETE__'"
            class="grid h-7 w-7 cursor-pointer place-items-center rounded-full border-0 transition-colors"
            :class="deletingId === c.conversation_id
                ? 'bg-bad text-white'
                : 'bg-transparent text-faint hover:bg-bg hover:text-bad'">
            <Trash2 :size="15" :stroke-width="1.8" />
          </button>
        </div>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { Pin, Pencil, Trash2 } from 'lucide-vue-next';

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

const fmtTime = (v) => {
  if (!v) return '';
  const d = new Date(String(v).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(v);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

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

const togglePinned = (chat) => {
  request('/api/chat/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: chat.conversation_id, pinned: !chat.pinned })
  }).then(fetchChats).catch(() => {});
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

defineExpose({ fetchChats });

onMounted(fetchChats);
</script>

<style scoped>
.chat-row.active {
  background: var(--color-card-hi);
  box-shadow: inset 3px 0 0 0 var(--color-accent);
}
.chat-row.pinned {
  background: color-mix(in srgb, var(--color-accent) 6%, var(--color-card));
}
.chat-row.pinned:hover {
  background: color-mix(in srgb, var(--color-accent) 10%, var(--color-card));
}
.chat-row.running {
  box-shadow: inset 3px 0 0 0 var(--color-good);
}
.chat-row.active.running {
  box-shadow: inset 3px 0 0 0 var(--color-accent);
}
.animate-status-pulse { animation: status-pulse 1.4s ease-in-out infinite; }
@keyframes status-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
</style>
