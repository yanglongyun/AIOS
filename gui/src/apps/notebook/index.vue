<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';

const notes = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const selectedId = ref(null);
const draft = reactive({ title: '', content: '' });
const titleRef = ref(null);

const selected = computed(() => notes.value.find((item) => item.id === selectedId.value) || null);
const wordCount = computed(() => draft.content.trim() ? draft.content.trim().length : 0);

const request = async (path, options = {}) => {
  const res = await fetch(`/apps/notebook${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
  return data;
};

const applySelected = (note) => {
  selectedId.value = note?.id || null;
  draft.title = note?.title || '';
  draft.content = note?.content || '';
};

const fetchAll = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await request('/list');
    notes.value = data.items || [];
    if (!selectedId.value && notes.value.length) applySelected(notes.value[0]);
    if (selectedId.value && !notes.value.some((item) => item.id === selectedId.value)) {
      applySelected(notes.value[0] || null);
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const createNote = async () => {
  saving.value = true;
  error.value = '';
  try {
    const data = await request('/create', {
      method: 'POST',
      body: JSON.stringify({ title: '未命名', content: '' }),
    });
    notes.value.unshift(data.item);
    applySelected(data.item);
    await nextTick();
    titleRef.value?.focus();
    titleRef.value?.select();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
};

const saveNote = async () => {
  if (!selected.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const data = await request('/update', {
      method: 'POST',
      body: JSON.stringify({
        id: selected.value.id,
        title: draft.title,
        content: draft.content,
      }),
    });
    const index = notes.value.findIndex((item) => item.id === data.item.id);
    if (index !== -1) notes.value[index] = data.item;
    applySelected(data.item);
    notes.value = [...notes.value].sort((a, b) => (b.pinned - a.pinned) || String(b.updatedAt).localeCompare(String(a.updatedAt)) || b.id - a.id);
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
};

const togglePinned = async (note) => {
  try {
    const data = await request('/update', {
      method: 'POST',
      body: JSON.stringify({ id: note.id, pinned: !note.pinned }),
    });
    const index = notes.value.findIndex((item) => item.id === note.id);
    if (index !== -1) notes.value[index] = data.item;
    notes.value = [...notes.value].sort((a, b) => (b.pinned - a.pinned) || String(b.updatedAt).localeCompare(String(a.updatedAt)) || b.id - a.id);
    if (selectedId.value === note.id) applySelected(data.item);
  } catch (e) {
    error.value = e.message;
  }
};

const removeNote = async (note) => {
  if (!window.confirm(`删除「${note.title || '未命名'}」？`)) return;
  try {
    await request('/delete', {
      method: 'POST',
      body: JSON.stringify({ id: note.id }),
    });
    notes.value = notes.value.filter((item) => item.id !== note.id);
    if (selectedId.value === note.id) applySelected(notes.value[0] || null);
  } catch (e) {
    error.value = e.message;
  }
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

onMounted(fetchAll);
</script>

<template>
  <div class="flex h-full min-h-0 flex-col bg-bg">
      <header class="flex flex-none items-center gap-3 border-b border-line px-6 py-4 max-md:px-4">
        <h1 class="m-0 text-[22px] font-semibold leading-none text-ink max-md:text-[19px]">记事本</h1>
        <button
          class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-3 text-[12.5px] font-medium text-blue-fg transition-colors hover:bg-line-hi disabled:opacity-50"
          :disabled="saving"
          @click="createNote">
          <span class="msi sm">add</span>
          <span>新建</span>
        </button>
        <div class="min-w-0 flex-1 text-[12px] text-faint">
          <span v-if="selected">更新于 {{ formatTime(selected.updatedAt) }} · {{ wordCount }} 字</span>
          <span v-else>选择或新建一条笔记</span>
        </div>
        <button
          v-if="selected"
          class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-accent"
          :title="selected.pinned ? '取消置顶' : '置顶'"
          @click="togglePinned(selected)">
          <span class="msi sm" :class="{ filled: selected.pinned }">push_pin</span>
        </button>
        <button
          v-if="selected"
          class="grid h-8 w-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-bad"
          title="删除"
          @click="removeNote(selected)">
          <span class="msi sm">delete</span>
        </button>
        <button
          v-if="selected"
          class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-3 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-line-hi disabled:opacity-50"
          :disabled="saving"
          @click="saveNote">
          <span class="msi sm">save</span>
          <span>{{ saving ? '保存中...' : '保存' }}</span>
        </button>
      </header>

      <section class="flex-none border-b border-line bg-bg-elev px-5 py-3 max-md:px-3">
        <div v-if="loading && !notes.length" class="py-3 text-center text-[13px] text-muted">加载中...</div>
        <div v-else class="flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="note in notes"
            :key="note.id"
            class="flex h-[74px] w-[220px] flex-none cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors"
            :class="selectedId === note.id ? 'border-transparent bg-blue-bg text-blue-fg' : 'border-line bg-bg text-muted hover:bg-bg-hi hover:text-ink'"
            @click="applySelected(note)">
            <span class="msi sm mt-0.5 flex-none" :class="{ filled: note.pinned }">{{ note.pinned ? 'push_pin' : 'article' }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13.5px] font-medium">{{ note.title || '未命名' }}</span>
              <span class="mt-1 line-clamp-2 block text-[11.5px] opacity-70">{{ note.content || '空白笔记' }}</span>
            </span>
          </button>
        </div>
      </section>

      <div v-if="error" class="mx-5 mt-3 rounded-lg px-3 py-2 text-[13px] text-bad max-md:mx-4"
        style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
        {{ error }}
      </div>

      <section v-if="selected" class="flex min-h-0 flex-1 flex-col px-8 py-6 max-md:px-4 max-md:py-4">
        <input
          ref="titleRef"
          v-model="draft.title"
          class="mb-4 w-full border-0 bg-transparent text-[30px] font-semibold leading-[1.15] text-ink outline-none placeholder:text-faint max-md:text-[24px]"
          placeholder="标题" />
        <textarea
          v-model="draft.content"
          class="min-h-0 flex-1 resize-none border-0 bg-transparent text-[15px] leading-[1.8] text-ink outline-none placeholder:text-faint"
          placeholder="开始记录..." />
      </section>

      <section v-else class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-muted">
        <span class="msi" style="font-size:42px;color:var(--color-faint)">edit_note</span>
        <div class="text-[14px]">还没有笔记</div>
        <button
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-4 py-2 text-[13px] font-semibold text-blue-fg"
          @click="createNote">
          <span class="msi sm">add</span>
          <span>新建笔记</span>
        </button>
      </section>
  </div>
</template>
