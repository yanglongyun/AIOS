<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-[#f5f0e8] font-['PingFang_SC',-apple-system,sans-serif] text-[#3a3a3a]">
    <div class="flex shrink-0 items-center justify-between px-5 pb-2 pt-5">
      <h1 class="text-[22px] font-bold text-[#5a4a3a]">随心记</h1>
      <button class="flex h-9 w-9 items-center justify-center rounded-[10px] border-none bg-transparent text-[#a09080] transition-all hover:bg-black/5 hover:text-[#5a4a3a]" @click="showSearch = !showSearch">
        <Search class="h-[18px] w-[18px]" />
      </button>
    </div>

    <div v-if="showSearch" class="relative shrink-0 px-5 pb-2.5">
      <input
        ref="searchInputEl"
        v-model="searchQuery"
        type="text"
        placeholder="搜索笔记..."
        class="w-full rounded-[10px] border-2 border-dashed border-[#d4c8b8] bg-white px-3.5 py-2.5 pr-8 text-sm text-[#3a3a3a] outline-none transition-colors placeholder:text-[#c4b8a8] focus:border-solid focus:border-[#c0a878]"
        @input="onSearchInput"
      />
      <button v-if="searchQuery" class="absolute right-7 top-1/2 -translate-y-1/2 border-none bg-transparent text-sm text-[#a09080]" @click="searchQuery = ''; onSearchInput()">✕</button>
    </div>

    <div class="flex-1 overflow-y-auto px-4 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="!notes.length && !loading" class="flex h-full flex-col items-center justify-center gap-2 text-[#b8a898]">
        <span class="text-4xl opacity-50">📝</span>
        <p class="text-sm">还没有笔记，写点什么吧</p>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
        <div
          v-for="(note, idx) in notes"
          :key="note.id"
          class="group relative min-h-[100px] cursor-default rounded p-4 shadow-[2px_3px_8px_rgba(0,0,0,0.08)] transition-all hover:!rotate-[-0.3deg] hover:-translate-y-0.5 hover:shadow-[3px_6px_16px_rgba(0,0,0,0.12)]"
          :class="stickyClass(idx)"
        >
          <span v-if="note.pinned" class="absolute -top-1.5 right-2 rotate-[15deg] text-base">📌</span>

          <template v-if="editingId === note.id">
            <textarea
              v-model="editingDraft"
              class="min-h-20 w-full resize-y rounded-md border border-black/10 bg-white/70 px-2.5 py-2 text-[13px] leading-6 text-[#3a3a3a] outline-none focus:border-[#c0a878]"
              @keydown.meta.enter.prevent="saveInlineEdit"
              @keydown.ctrl.enter.prevent="saveInlineEdit"
            />
            <div class="mt-2 flex justify-end gap-1.5">
                <button class="rounded-md bg-black/5 px-3 py-1 text-[11px] text-[#888] transition-colors hover:bg-black/10" @click="cancelInlineEdit">取消</button>
                <button class="rounded-md bg-[#e8a44a] px-3 py-1 text-[11px] text-white transition-colors hover:bg-[#d49440] disabled:cursor-not-allowed disabled:opacity-40" :disabled="editingSaving || !editingDraft.trim()" @click="saveInlineEdit">
                  {{ editingSaving ? '...' : '保存' }}
                </button>
              </div>
            </template>

          <template v-else>
            <div class="line-clamp-6 whitespace-pre-wrap break-words text-[13px] leading-7">{{ note.content || '（空）' }}</div>
            <div class="mt-2.5 flex items-center justify-between">
              <span class="text-[10px] text-black/30">{{ formatTime(note.updated_at || note.created_at) }}</span>
              <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button class="flex h-6 w-6 items-center justify-center rounded-md border-none bg-white/60 text-[11px] transition-colors hover:bg-white/90" @click="editNote(note)" title="编辑">✏️</button>
                <button class="flex h-6 w-6 items-center justify-center rounded-md border-none bg-white/60 text-[11px] transition-colors hover:bg-white/90" @click="togglePin(note)" :title="note.pinned ? '取消置顶' : '置顶'">📌</button>
                <button class="flex h-6 w-6 items-center justify-center rounded-md border-none bg-white/60 text-[11px] transition-colors hover:bg-white/90" @click="deleteNote(note.id)" title="删除">🗑</button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 py-3 text-xs text-[#b8a898]">
        <button class="border-none bg-none px-2 py-1 text-lg text-[#a09080] hover:text-[#5a4a3a] disabled:cursor-not-allowed disabled:opacity-30" :disabled="page <= 1 || loading" @click="goPrevPage">‹</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button class="border-none bg-none px-2 py-1 text-lg text-[#a09080] hover:text-[#5a4a3a] disabled:cursor-not-allowed disabled:opacity-30" :disabled="page >= totalPages || loading" @click="goNextPage">›</button>
      </div>
    </div>

    <div v-if="optimizedDraft" class="mx-4 mb-2 shrink-0 rounded-[10px] border border-[#f0e4c8] bg-[#fff9e8] px-3.5 py-3">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-xs font-medium text-[#c0903a]">✨ 优化结果</span>
        <div class="flex gap-1.5">
          <button class="rounded-md bg-[#e8a44a] px-2.5 py-0.5 text-[11px] text-white transition-colors hover:bg-[#d49440]" @click="applyOptimized">使用</button>
          <button class="rounded-md bg-transparent px-2.5 py-0.5 text-[11px] text-[#999] transition-colors hover:bg-black/5" @click="closeOptimized">关闭</button>
        </div>
      </div>
      <div class="max-h-[100px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-6 text-[#3a3a3a]">{{ optimizedDraft }}</div>
    </div>

    <div v-if="error" class="mx-4 mb-2 shrink-0 rounded-lg bg-[#fef0f0] px-3 py-2 text-xs text-[#e85d5d]">{{ error }}</div>

    <div class="shrink-0 bg-[#eee8dd] px-4 pb-5 pt-2.5">
      <label class="mb-2.5 flex cursor-pointer items-center gap-2 text-[12px] text-[#8a7a68]">
        <input
          type="checkbox"
          :checked="syncToAi"
          class="h-3.5 w-3.5 accent-[#e8a44a]"
          @change="toggleSyncToAi"
        />
        <span>同步给 AI（创建后提醒 AI）</span>
      </label>
      <div class="flex items-center gap-2">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          placeholder="写点什么..."
          class="max-h-[100px] flex-1 resize-none rounded-[10px] border-2 border-dashed border-[#d4c8b8] bg-white px-3.5 py-3 text-sm leading-6 text-[#3a3a3a] outline-none transition-colors placeholder:text-[#c4b8a8] focus:border-solid focus:border-[#c0a878]"
          @input="autoResize"
          @keydown.meta.enter.prevent="saveNote"
          @keydown.ctrl.enter.prevent="saveNote"
        />
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-none bg-transparent text-[#e8a44a] transition-all hover:bg-[rgba(232,164,74,0.1)] disabled:cursor-not-allowed disabled:opacity-30" :disabled="optimizing || !draft.trim()" title="AI 优化" @click="optimizeDraft">
          <span v-if="optimizing" class="text-xs">...</span>
          <Sparkles v-else class="h-[18px] w-[18px]" />
        </button>
        <button class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-none bg-[#e8a44a] text-white shadow-[0_2px_8px_rgba(232,164,74,0.3)] transition-all hover:scale-105 hover:bg-[#d49440] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100" :disabled="creating || !draft.trim()" @click="saveNote">
          <span v-if="creating" class="text-xs">...</span>
          <Plus v-else class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, watch } from 'vue';
import { Plus, Search, Sparkles } from 'lucide-vue-next';
const API_BASE = '/apps/notebook';
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
const showSearch = ref(false);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const inputEl = ref(null);
const searchInputEl = ref(null);
const syncToAi = ref(localStorage.getItem('notebook.syncToAi') !== '0');
let searchTimer = null;

const stickyClass = (idx) => {
  const classes = [
    'bg-[#fff9c4] rotate-[-0.8deg]',
    'bg-[#c8e6c9] rotate-[0.5deg]',
    'bg-[#ffccbc] rotate-[-0.3deg]',
    'bg-[#b3e5fc] rotate-[0.7deg]',
    'bg-[#e1bee7] rotate-[-0.5deg]'
  ];
  return classes[idx % 5];
};

const autoResize = () => {
  if (!inputEl.value) return;
  inputEl.value.style.height = 'auto';
  inputEl.value.style.height = Math.min(inputEl.value.scrollHeight, 100) + 'px';
};

watch(showSearch, (v) => {
  if (v) nextTick(() => searchInputEl.value?.focus());
});

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
      body: JSON.stringify({ content, syncToAi: syncToAi.value })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    draft.value = '';
    if (inputEl.value) inputEl.value.style.height = 'auto';
    page.value = 1;
    await fetchNotes();
  } catch (e) {
    error.value = e.message || '保存失败';
  } finally {
    creating.value = false;
  }
};

const toggleSyncToAi = (event) => {
  syncToAi.value = Boolean(event.target?.checked);
  localStorage.setItem('notebook.syncToAi', syncToAi.value ? '1' : '0');
};

const optimizeDraft = async () => {
  const content = draft.value.trim();
  if (!content || optimizing.value) return;

  optimizing.value = true;
  error.value = '';
  optimizedDraft.value = '';
  try {
    const res = await fetch('/api/task/create/instant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app: 'notebook',
        title: '笔记优化',
        prompt: '优化笔记表达并返回结构化结果',
        schema: { required: ['optimized'] },
        messages: [
          {
            role: 'system',
            content: '只返回 JSON：{"optimized":"..."}'
          },
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
    const parsed = JSON.parse(String(data.response || '{}'));
    const improved = String(parsed.optimized || '').trim();
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
  nextTick(autoResize);
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
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

onMounted(fetchNotes);
</script>
