<template>
  <aside class="chat-side-panel flex flex-col overflow-hidden">
    <!-- 操作区 -->
    <div class="flex shrink-0 flex-col gap-0.5 px-2.5 pt-3">
      <button class="side-item" @click="$emit('new')">
        <Plus :size="15" :stroke-width="1.8" />
        {{ '新对话' }}
      </button>
      <div class="side-search">
        <Search :size="15" :stroke-width="1.8" />
        <input
          v-model="keyword"
          type="text"
          :placeholder="'搜索'"
        />
      </div>
    </div>

    <!-- 列表（按时间分组） -->
    <div class="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4 [scrollbar-width:none]">
      <div v-if="!filtered.length" class="py-14 text-center text-[12.5px] text-faint">
        {{ '暂无对话记录' }}
      </div>
      <template v-for="group in groups" :key="group.label">
        <div class="side-group">{{ group.label }}</div>
        <button
          v-for="c in group.items"
          :key="c.id"
          class="chat-item"
          :class="{ on: c.id === currentId }"
          :title="c.title || '新对话'"
          @click="$emit('open', c)"
        >{{ c.title || '新对话' }}</button>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { Plus, Search } from 'lucide-vue-next';

defineProps({
  currentId: { type: [String, Number], default: null }
});
defineEmits(['open', 'new']);

const chats = ref([]);
const keyword = ref('');

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return chats.value;
  return chats.value.filter((c) => String(c.title || '').toLowerCase().includes(kw));
});

const groups = computed(() => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86400000;
  const buckets = [
    { label: '今天', items: [] },
    { label: '最近 7 天', items: [] },
    { label: '更早', items: [] },
  ];
  for (const c of filtered.value) {
    const ts = new Date(c.updated_at || c.created_at || 0).getTime();
    if (ts >= startOfToday) buckets[0].items.push(c);
    else if (ts >= startOfToday - dayMs * 6) buckets[1].items.push(c);
    else buckets[2].items.push(c);
  }
  return buckets.filter((b) => b.items.length);
});

async function reload() {
  try {
    const res = await fetch('/api/chat/list');
    chats.value = await res.json().catch(() => []);
  } catch {}
}

onMounted(reload);
defineExpose({ reload });
</script>

<style scoped>
.chat-side-panel {
  background: #fcfcfc;
  border-right: 1px solid var(--color-line);
}
:root.dark .chat-side-panel,
.dark .chat-side-panel {
  background: var(--color-bg-elev);
}
.side-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--color-muted);
  font-size: 13.5px;
  text-align: left;
  cursor: pointer;
}
.side-item:hover {
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
  color: var(--color-ink);
}
.side-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 9px;
  color: var(--color-muted);
}
.side-search:focus-within {
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
}
.side-search input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 13.5px;
  color: var(--color-ink);
}
.side-search input::placeholder {
  color: var(--color-faint);
}
.side-group {
  margin-top: 18px;
  padding: 0 10px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
}
.chat-item {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--color-muted);
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.chat-item:hover,
.chat-item.on {
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
  color: var(--color-ink);
}
</style>
