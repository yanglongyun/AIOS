<template>
  <div class="p-6 w-full max-w-4xl mx-auto h-full overflow-y-auto text-neutral-900 dark:text-neutral-100">
    <div class="mb-8">
      <h1 class="text-3xl font-bold italic tracking-tight">Notebook.</h1>
      <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">记录想法，快速检索，置顶重点。</p>
    </div>

    <section class="bg-neutral-100 dark:bg-neutral-800/30 p-2 rounded-2xl mb-8">
      <textarea
        v-model="draft"
        class="w-full min-h-[120px] bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm leading-6 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
        placeholder="写点什么...（Ctrl/Cmd + Enter 保存）"
        @keydown.meta.enter.prevent="saveNote"
        @keydown.ctrl.enter.prevent="saveNote"
      />
      <div class="mt-2 px-2 flex items-center justify-between">
        <span class="text-xs text-neutral-500">{{ draft.length }} 字</span>
        <div class="flex items-center gap-2">
          <button
            class="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="optimizing || !draft.trim()"
            @click="optimizeDraft"
          >
            {{ optimizing ? '优化中...' : '优化' }}
          </button>
          <button
            class="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="creating || !draft.trim()"
            @click="saveNote"
          >
            {{ creating ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
      <div v-if="optimizedDraft" class="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-800 p-3">
        <div class="flex items-center justify-between mb-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">优化结果</p>
          <div class="flex items-center gap-2">
            <button class="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500" @click="applyOptimized">直接使用</button>
            <button class="text-xs px-2 py-1 rounded border border-indigo-300 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100/60 dark:hover:bg-indigo-800/50" @click="closeOptimized">关闭</button>
          </div>
        </div>
        <div class="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-200">{{ optimizedDraft }}</div>
      </div>
      <p v-if="error" class="mt-2 px-2 text-xs text-rose-500">{{ error }}</p>
    </section>

    <section class="bg-neutral-100 dark:bg-neutral-800/30 p-2 rounded-2xl mb-6">
      <div class="bg-white dark:bg-neutral-800 rounded-xl flex flex-wrap gap-2 items-center px-3 py-2">
        <input
          v-model="searchQuery"
          type="text"
          class="flex-1 min-w-[220px] bg-transparent border-none rounded-xl px-1 py-1.5 text-sm focus:ring-0 outline-none"
          placeholder="搜索笔记内容..."
          @input="onSearchInput"
        />
        <span class="text-xs text-neutral-400">每页 {{ PAGE_SIZE }} 条</span>
      </div>
    </section>

    <section class="bg-white dark:bg-transparent rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden mb-6">
      <div class="px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
        <h3 class="text-sm font-bold uppercase tracking-widest text-neutral-400">笔记列表</h3>
        <span class="text-[10px] text-neutral-400">第 {{ page }} 页</span>
      </div>

      <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
        <article v-for="note in notes" :key="note.id" class="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group">
          <template v-if="editingId === note.id">
            <textarea
              v-model="editingDraft"
              class="w-full min-h-[110px] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              @keydown.meta.enter.prevent="saveInlineEdit"
              @keydown.ctrl.enter.prevent="saveInlineEdit"
            />
          </template>

          <template v-else>
            <div class="flex items-start gap-3">
              <div v-if="note.pinned" class="mt-0.5 text-amber-500" title="已置顶">📌</div>
              <div class="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-800 dark:text-neutral-100">{{ note.content || '（空）' }}</div>
            </div>
          </template>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-[11px] text-neutral-400">{{ formatTime(note.updated_at || note.created_at) }}</span>
            <div class="flex items-center gap-3 text-sm">
              <template v-if="editingId === note.id">
                <button class="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-50" :disabled="editingSaving" @click="cancelInlineEdit">取消</button>
                <button class="text-indigo-600 hover:text-indigo-700 disabled:opacity-50" :disabled="editingSaving || !editingDraft.trim()" @click="saveInlineEdit">
                  {{ editingSaving ? '保存中...' : '保存' }}
                </button>
              </template>
              <button v-else class="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200" @click="editNote(note)">编辑</button>
              <button class="text-amber-600 hover:text-amber-700" @click="togglePin(note)">{{ note.pinned ? '取消置顶' : '置顶' }}</button>
              <button class="text-rose-500 hover:text-rose-600" @click="deleteNote(note.id)">删除</button>
            </div>
          </div>
        </article>

        <div v-if="!notes.length" class="py-16 text-center text-neutral-400 text-sm">暂无笔记，开始记录第一条吧</div>
      </div>
    </section>

    <section class="bg-neutral-100 dark:bg-neutral-800/30 p-2 rounded-2xl flex items-center justify-between">
      <span class="text-sm text-neutral-500 px-2">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</span>
      <div class="flex items-center gap-2">
        <button
          class="bg-white dark:bg-neutral-800 rounded-xl px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="page <= 1 || loading"
          @click="goPrevPage"
        >
          上一页
        </button>
        <button
          class="bg-white dark:bg-neutral-800 rounded-xl px-4 py-2 text-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="page >= totalPages || loading"
          @click="goNextPage"
        >
          下一页
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/notebook';
const PAGE_SIZE = 10;

const notes = ref([]);
const draft = ref('');
const editingId = ref(null);
const editingDraft = ref('');
const creating = ref(false);
const optimizing = ref(false);
const editingSaving = ref(false);
const loading = ref(false);
const error = ref('');
const optimizedDraft = ref('');
const searchQuery = ref('');
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
let searchTimer = null;

const fetchNotes = async () => {
  try {
    loading.value = true;
    const params = new URLSearchParams({
      q: searchQuery.value,
      page: String(page.value),
      pageSize: String(PAGE_SIZE)
    });
    const res = await fetch(`${API_BASE}/list?${params.toString()}`);
    const data = await res.json();
    notes.value = data.items || [];
    total.value = Number(data.total || 0);
    totalPages.value = Number(data.totalPages || 1);
    if (page.value > totalPages.value) {
      page.value = totalPages.value;
      return fetchNotes();
    }
  } catch (e) {
    error.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
};

const saveNote = async () => {
  const content = draft.value.trim();
  if (!content || creating.value) return;

  creating.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    draft.value = '';
    page.value = 1;
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '保存失败';
  } finally {
    creating.value = false;
  }
};

const optimizeDraft = async () => {
  const content = draft.value.trim();
  if (!content || optimizing.value) return;

  optimizing.value = true;
  error.value = '';
  optimizedDraft.value = '';
  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是用户的记事本写作助手。下面内容是用户准备保存到记事本的一条笔记。请在不改变原意的前提下，优化表达、结构和可读性，保留关键信息与语气。只返回可直接保存的优化后笔记正文，不要解释、不要加标题、不要使用代码块。'
          },
          { role: 'user', content }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
    const improved = (data.message?.content || '').trim();
    if (!improved) throw new Error('优化结果为空');
    optimizedDraft.value = improved;
  } catch (e) {
    error.value = e.message || '优化失败';
  } finally {
    optimizing.value = false;
  }
};

const applyOptimized = () => {
  if (!optimizedDraft.value) return;
  draft.value = optimizedDraft.value;
  optimizedDraft.value = '';
};

const closeOptimized = () => {
  optimizedDraft.value = '';
};

const editNote = (note) => {
  editingId.value = note.id;
  editingDraft.value = note.content || '';
};

const cancelInlineEdit = () => {
  editingId.value = null;
  editingDraft.value = '';
};

const saveInlineEdit = async () => {
  const content = editingDraft.value.trim();
  if (!editingId.value || !content || editingSaving.value) return;

  editingSaving.value = true;
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId.value, content })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    cancelInlineEdit();
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '更新失败';
  } finally {
    editingSaving.value = false;
  }
};

const deleteNote = async (id) => {
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (editingId.value === id) cancelInlineEdit();
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '删除失败';
  }
};

const togglePin = async (note) => {
  error.value = '';
  try {
    const res = await fetch(`${API_BASE}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: note.id, pinned: note.pinned ? 0 : 1 })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '置顶更新失败';
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    fetchNotes();
  }, 250);
};

const goPrevPage = async () => {
  if (page.value <= 1 || loading.value) return;
  page.value -= 1;
  await fetchNotes();
};

const goNextPage = async () => {
  if (page.value >= totalPages.value || loading.value) return;
  page.value += 1;
  await fetchNotes();
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
};

onMounted(fetchNotes);
</script>
