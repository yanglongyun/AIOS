<template>
  <div class="notebook-root">

    <!-- 顶部栏 -->
    <div class="nb-header">
      <h1>随心记</h1>
      <button class="nb-icon-btn" @click="showSearch = !showSearch">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </button>
    </div>

    <!-- 搜索栏 -->
    <div v-if="showSearch" class="nb-search">
      <input
        ref="searchInputEl"
        v-model="searchQuery"
        type="text"
        placeholder="搜索笔记..."
        @input="onSearchInput"
      />
      <button v-if="searchQuery" class="nb-search-clear" @click="searchQuery = ''; onSearchInput()">✕</button>
    </div>

    <!-- 笔记列表 -->
    <div class="nb-scroll">
      <!-- 空状态 -->
      <div v-if="!notes.length && !loading" class="nb-empty">
        <span class="nb-empty-icon">📝</span>
        <p>还没有笔记，写点什么吧</p>
      </div>

      <!-- 便签网格 -->
      <div v-else class="nb-grid">
        <div
          v-for="(note, idx) in notes" :key="note.id"
          class="nb-sticky"
          :class="[`c${(idx % 5) + 1}`, { pinned: note.pinned }]"
        >
          <!-- 置顶图钉 -->
          <span v-if="note.pinned" class="nb-pin">📌</span>

          <!-- 编辑模式 -->
          <template v-if="editingId === note.id">
            <textarea
              v-model="editingDraft"
              class="nb-edit-area"
              @keydown.meta.enter.prevent="saveInlineEdit"
              @keydown.ctrl.enter.prevent="saveInlineEdit"
            />
            <div class="nb-edit-actions">
              <button class="nb-edit-cancel" @click="cancelInlineEdit">取消</button>
              <button class="nb-edit-save" :disabled="editingSaving || !editingDraft.trim()" @click="saveInlineEdit">
                {{ editingSaving ? '...' : '保存' }}
              </button>
            </div>
          </template>

          <!-- 展示模式 -->
          <template v-else>
            <div class="nb-sticky-text">{{ note.content || '（空）' }}</div>
            <div class="nb-sticky-bottom">
              <span class="nb-sticky-time">{{ formatTime(note.updated_at || note.created_at) }}</span>
              <div class="nb-sticky-ops">
                <button @click="editNote(note)" title="编辑">✏️</button>
                <button @click="togglePin(note)" :title="note.pinned ? '取消置顶' : '置顶'">📌</button>
                <button @click="deleteNote(note.id)" title="删除">🗑</button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="nb-pager">
        <button :disabled="page <= 1 || loading" @click="goPrevPage">‹</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages || loading" @click="goNextPage">›</button>
      </div>
    </div>

    <!-- 优化结果浮层 -->
    <div v-if="optimizedDraft" class="nb-optimize">
      <div class="nb-optimize-head">
        <span>✨ 优化结果</span>
        <div class="nb-optimize-btns">
          <button class="nb-opt-use" @click="applyOptimized">使用</button>
          <button class="nb-opt-close" @click="closeOptimized">关闭</button>
        </div>
      </div>
      <div class="nb-optimize-body">{{ optimizedDraft }}</div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="nb-error">{{ error }}</div>

    <!-- 底部输入区 -->
    <div class="nb-input-bar">
      <div class="nb-input-row">
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          placeholder="写点什么..."
          @input="autoResize"
          @keydown.meta.enter.prevent="saveNote"
          @keydown.ctrl.enter.prevent="saveNote"
        />
        <button
          class="nb-btn-ai"
          :disabled="optimizing || !draft.trim()"
          title="AI 优化"
          @click="optimizeDraft"
        >
          <span v-if="optimizing">...</span>
          <span v-else>✨</span>
        </button>
        <button
          class="nb-btn-add"
          :disabled="creating || !draft.trim()"
          @click="saveNote"
        >
          <span v-if="creating">...</span>
          <span v-else>+</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, watch } from 'vue';

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
const showSearch = ref(false);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);
const inputEl = ref(null);
const searchInputEl = ref(null);
let searchTimer = null;

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
      body: JSON.stringify({ content })
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

<style scoped>
.notebook-root {
  font-family: -apple-system, 'PingFang SC', sans-serif;
  background: #f5f0e8;
  color: #3a3a3a;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部 */
.nb-header {
  padding: 20px 20px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.nb-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #5a4a3a;
}
.nb-icon-btn {
  width: 36px; height: 36px; border: none; background: transparent;
  border-radius: 10px; cursor: pointer; color: #a09080;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.nb-icon-btn:hover { background: rgba(0,0,0,0.05); color: #5a4a3a; }

/* 搜索 */
.nb-search {
  padding: 0 20px 10px;
  flex-shrink: 0;
  position: relative;
}
.nb-search input {
  width: 100%;
  padding: 10px 32px 10px 14px;
  border: 2px dashed #d4c8b8;
  border-radius: 10px;
  background: #fff;
  font-size: 14px;
  outline: none;
  color: #3a3a3a;
  font-family: inherit;
  transition: border-color 0.15s;
}
.nb-search input:focus { border-color: #c0a878; border-style: solid; }
.nb-search input::placeholder { color: #c4b8a8; }
.nb-search-clear {
  position: absolute;
  right: 28px; top: 50%; transform: translateY(-50%);
  border: none; background: none; cursor: pointer;
  color: #a09080; font-size: 14px;
}

/* 滚动区 */
.nb-scroll {
  flex: 1; overflow-y: auto; padding: 8px 16px 16px;
}
.nb-scroll::-webkit-scrollbar { width: 0; }

/* 空状态 */
.nb-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #b8a898;
  gap: 8px;
}
.nb-empty-icon { font-size: 36px; opacity: 0.5; }
.nb-empty p { font-size: 14px; }

/* 便签网格 */
.nb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

/* 便签卡片 */
.nb-sticky {
  padding: 16px;
  border-radius: 4px;
  min-height: 100px;
  position: relative;
  box-shadow: 2px 3px 8px rgba(0,0,0,0.08);
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: default;
}
.nb-sticky:hover {
  transform: translateY(-2px) rotate(-0.3deg) !important;
  box-shadow: 3px 6px 16px rgba(0,0,0,0.12);
}

/* 五种颜色 + 微旋转 */
.nb-sticky.c1 { background: #fff9c4; transform: rotate(-0.8deg); }
.nb-sticky.c2 { background: #c8e6c9; transform: rotate(0.5deg); }
.nb-sticky.c3 { background: #ffccbc; transform: rotate(-0.3deg); }
.nb-sticky.c4 { background: #b3e5fc; transform: rotate(0.7deg); }
.nb-sticky.c5 { background: #e1bee7; transform: rotate(-0.5deg); }

/* 置顶图钉 */
.nb-pin {
  position: absolute;
  top: -6px;
  right: 8px;
  font-size: 16px;
  transform: rotate(15deg);
}

/* 便签文字 */
.nb-sticky-text {
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nb-sticky-bottom {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nb-sticky-time { font-size: 10px; color: rgba(0,0,0,0.3); }

.nb-sticky-ops {
  display: flex; gap: 4px;
  opacity: 0; transition: opacity 0.15s;
}
.nb-sticky:hover .nb-sticky-ops { opacity: 1; }

.nb-sticky-ops button {
  width: 24px; height: 24px; border: none;
  background: rgba(255,255,255,0.6); border-radius: 6px;
  cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.1s;
}
.nb-sticky-ops button:hover { background: rgba(255,255,255,0.9); }

/* 编辑模式 */
.nb-edit-area {
  width: 100%;
  min-height: 80px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
  resize: vertical;
  font-family: inherit;
  color: #3a3a3a;
}
.nb-edit-area:focus { border-color: #c0a878; }
.nb-edit-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.nb-edit-cancel, .nb-edit-save {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.nb-edit-cancel {
  background: rgba(0,0,0,0.06);
  color: #888;
}
.nb-edit-cancel:hover { background: rgba(0,0,0,0.1); }
.nb-edit-save {
  background: #e8a44a;
  color: #fff;
}
.nb-edit-save:hover { background: #d49440; }
.nb-edit-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* 分页 */
.nb-pager {
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #b8a898;
}
.nb-pager button {
  border: none; background: none;
  font-size: 18px; color: #a09080;
  cursor: pointer; padding: 4px 8px;
}
.nb-pager button:hover { color: #5a4a3a; }
.nb-pager button:disabled { opacity: 0.3; cursor: not-allowed; }

/* 优化结果 */
.nb-optimize {
  flex-shrink: 0;
  margin: 0 16px 8px;
  padding: 12px 14px;
  background: #fff9e8;
  border: 1px solid #f0e4c8;
  border-radius: 10px;
}
.nb-optimize-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.nb-optimize-head > span {
  font-size: 12px;
  font-weight: 500;
  color: #c0903a;
}
.nb-optimize-btns { display: flex; gap: 6px; }
.nb-opt-use, .nb-opt-close {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
}
.nb-opt-use { background: #e8a44a; color: #fff; }
.nb-opt-use:hover { background: #d49440; }
.nb-opt-close { background: transparent; color: #999; }
.nb-opt-close:hover { background: rgba(0,0,0,0.05); }
.nb-optimize-body {
  font-size: 13px;
  line-height: 1.6;
  color: #3a3a3a;
  max-height: 100px;
  overflow-y: auto;
  white-space: pre-wrap;
}

/* 错误 */
.nb-error {
  flex-shrink: 0;
  margin: 0 16px 8px;
  font-size: 12px;
  color: #e85d5d;
  background: #fef0f0;
  border-radius: 8px;
  padding: 8px 12px;
}

/* 底部输入 */
.nb-input-bar {
  flex-shrink: 0;
  padding: 10px 16px 20px;
  background: #eee8dd;
}
.nb-input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}
.nb-input-row textarea {
  flex: 1;
  padding: 12px 14px;
  background: #fff;
  border: 2px dashed #d4c8b8;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  max-height: 100px;
  font-family: inherit;
  color: #3a3a3a;
  transition: border 0.15s;
}
.nb-input-row textarea:focus { border-color: #c0a878; border-style: solid; }
.nb-input-row textarea::placeholder { color: #c4b8a8; }

.nb-btn-ai {
  width: 36px; height: 36px; border: none;
  background: transparent; border-radius: 10px;
  cursor: pointer; font-size: 16px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #e8a44a;
  transition: all 0.15s;
}
.nb-btn-ai:hover { background: rgba(232,164,74,0.1); }
.nb-btn-ai:disabled { opacity: 0.3; cursor: not-allowed; }

.nb-btn-add {
  width: 40px; height: 40px; border: none;
  border-radius: 50%; background: #e8a44a; color: #fff;
  cursor: pointer; font-size: 22px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(232,164,74,0.3);
  transition: all 0.15s;
}
.nb-btn-add:hover { background: #d49440; transform: scale(1.05); }
.nb-btn-add:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
</style>
