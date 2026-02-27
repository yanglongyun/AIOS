<template>
  <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
    <!-- 顶部标题栏 -->
    <div class="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-gray-100 dark:border-neutral-800">
      <button v-if="!sidebarOpen"
        @click="$emit('open-sidebar')"
        title="展开侧边栏"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="2.5" height="12" rx="1"/>
          <rect x="5.5" y="2" width="2.5" height="12" rx="1"/>
          <path d="M10.5 8l3.5-3.5v7L10.5 8z"/>
        </svg>
      </button>
      <span class="flex-1 min-w-0 text-sm font-medium text-neutral-700 dark:text-neutral-300" :class="!sidebarOpen ? '' : 'pl-1'">记事本</span>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden p-5">
      <div class="max-w-2xl mx-auto space-y-3">
        <NotebookComposer
          v-model="newNoteContent"
          :creating="creating"
          @submit="createNote"
          @keydown="handleComposerKeydown"
        />

        <NotebookItem
          v-for="note in notes"
          :key="note.id"
          :note="note"
          @update="updateNote"
          @remove="removeNote"
        />

        <div v-if="!notes.length" class="text-sm text-neutral-400 py-4 text-center">暂无笔记</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NotebookComposer from '../../components/apps/notebook/NotebookComposer.vue';
import NotebookItem from '../../components/apps/notebook/NotebookItem.vue';

const props = defineProps(['sidebarOpen']);
defineEmits(['toggle-sidebar', 'open-sidebar']);

const notes = ref([]);
const newNoteContent = ref('');
const creating = ref(false);

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchNotes = async () => {
  notes.value = await request('/api/apps/notebook/list');
};

const createNote = async () => {
  const content = newNoteContent.value.trim();
  if (!content || creating.value) return;
  creating.value = true;
  try {
    await request('/api/apps/notebook/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    newNoteContent.value = '';
    await fetchNotes();
  } finally {
    creating.value = false;
  }
};

const handleComposerKeydown = async (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    await createNote();
  }
};

const updateNote = async (id, content) => {
  await request('/api/apps/notebook/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content })
  });
  await fetchNotes();
};

const removeNote = async (id) => {
  await request('/api/apps/notebook/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  notes.value = notes.value.filter((n) => n.id !== id);
};

onMounted(fetchNotes);
</script>
