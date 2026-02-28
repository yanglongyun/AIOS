<template>
  <div class="hp-list">

    <div v-if="!chats.length" class="hp-empty">📭 暂无历史对话</div>

    <div
      v-for="c in chats"
      :key="c.id"
      class="hp-item group"
    >
      <!-- 编辑状态 -->
      <template v-if="editingId === c.id">
        <input
          ref="editInput"
          v-model="editTitle"
          @keydown.enter="confirmRename(c.id)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(c.id)"
          class="hp-edit-input"
        />
      </template>

      <!-- 正常状态 -->
      <template v-else>
        <button @click="$emit('open-chat', c)" class="hp-chat-btn">
          <div class="hp-chat-title">{{ c.title || c.id.slice(0, 8) }}</div>
          <div class="hp-chat-date">{{ c.created_at }}</div>
        </button>

        <div class="hp-actions">
          <button
            v-if="deletingId !== c.id"
            @click.stop="startRename(c)"
            title="重命名"
            class="hp-action-btn">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <span v-if="deletingId === c.id" class="hp-delete-confirm">确认删除?</span>
          <button
            @click.stop="confirmDelete(c.id)"
            :title="deletingId === c.id ? '点击确认' : '删除'"
            class="hp-action-btn"
            :class="deletingId === c.id ? 'hp-action-danger' : ''">
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

<style scoped>
.hp-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hp-empty {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: #a0907a;
  font-family: 'Georgia', 'PingFang SC', serif;
}

.hp-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 10px 12px;
  transition: background 0.15s;
}
.hp-item:hover {
  background: #f5ead8;
}

.hp-edit-input {
  flex: 1;
  min-width: 0;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f5ead8;
  border: 1px solid #dcd0b8;
  font-size: 13px;
  color: #4a3a28;
  outline: none;
  font-family: 'Georgia', 'PingFang SC', serif;
}

.hp-chat-btn {
  flex: 1;
  min-width: 0;
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: 'Georgia', 'PingFang SC', serif;
}
.hp-chat-title {
  font-size: 14px;
  color: #4a3a28;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hp-chat-date {
  font-size: 11px;
  color: #b8a888;
  margin-top: 2px;
}

.hp-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}
.group:hover .hp-actions { opacity: 1; }

.hp-action-btn {
  width: 28px; height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #b8a888;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.hp-action-btn:hover {
  background: #ece0c8;
  color: #5a4a38;
}
.hp-action-btn.hp-action-danger {
  background: #c04040;
  color: #fff;
}

.hp-delete-confirm {
  font-size: 11px;
  color: #c04040;
  padding: 0 4px;
  font-family: 'Georgia', 'PingFang SC', serif;
}
</style>
