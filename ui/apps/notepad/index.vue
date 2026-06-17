<template>
  <div class="h-full overflow-y-auto px-6 pb-7 pt-[18px] dotgrid">
    <section v-if="!active" class="mx-auto grid max-w-[860px] gap-4">
      <div class="flex items-center gap-3">
        <h2 class="flex-1 text-[17px] font-bold text-[var(--ink)]">记事本</h2>
        <button class="rounded-[10px] bg-[var(--accent-d)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2563eb]" type="button" @click="newNote">新笔记</button>
      </div>

      <label class="flex items-center gap-2 rounded-xl border border-[var(--line2)] bg-white px-3 py-2.5 shadow-card">
        <Search class="h-4 w-4 text-[var(--muted)]" />
        <input v-model="query" class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" placeholder="搜索笔记" />
      </label>

      <div v-if="filteredNotes.length" class="columns-1 gap-3 sm:columns-2 lg:columns-3">
        <button
          v-for="note in filteredNotes"
          :key="note.id"
          class="mb-3 block w-full break-inside-avoid rounded-2xl border border-[var(--line2)] p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          :style="{ background: note.color || '#ffffff' }"
          type="button"
          @click="openNote(note)"
        >
          <div class="mb-2 flex items-center gap-2">
            <span class="text-lg">{{ note.emoji || '📝' }}</span>
            <b class="min-w-0 flex-1 truncate text-[14px] text-[var(--ink)]">{{ note.title || firstLine(note.content) || '无标题' }}</b>
            <Pin v-if="note.pinned" class="h-3.5 w-3.5 text-[var(--accent-d)]" />
          </div>
          <p class="line-clamp-5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink2)]">{{ note.content || '空笔记' }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <span v-if="note.folder" class="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">{{ note.folder }}</span>
            <span v-for="tag in note.tags" :key="tag" class="rounded-full bg-[#eef4fe] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-d)]">#{{ tag }}</span>
          </div>
        </button>
      </div>
      <div v-else class="rounded-xl border border-dashed border-[var(--line2)] bg-white p-10 text-center text-[13px] text-[var(--muted)]">
        <b class="mb-1 block text-[16px] text-[var(--ink)]">还没有笔记</b>
        新建一篇，颜色、标签和 AI 都在编辑器里。
      </div>

      <div class="pointer-events-none fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white opacity-0 transition" :class="{ 'opacity-100': toast }">{{ toast }}</div>
    </section>

    <section v-else class="mx-auto grid max-w-[860px] gap-3">
      <div class="flex items-center gap-2">
        <button class="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]" type="button" @click="closeEditor">
          <ChevronLeft class="h-5 w-5" />
        </button>
        <h2 class="flex-1 text-[17px] font-bold text-[var(--ink)]">编辑笔记</h2>
        <button class="grid h-8 w-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[#fef2f2] hover:text-[#b91c1c]" type="button" title="删除" @click="removeActive">
          <Trash2 class="h-4 w-4" />
        </button>
        <button class="rounded-[10px] bg-[var(--accent-d)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2563eb]" type="button" @click="closeEditor">完成</button>
      </div>

      <div class="rounded-2xl border border-[var(--line2)] p-5 shadow-card" :style="{ background: active.color || '#ffffff' }">
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <button
            v-for="color in palette"
            :key="color"
            class="h-6 w-6 rounded-full border border-black/10 shadow-sm"
            :class="{ 'ring-2 ring-[var(--accent-d)] ring-offset-2': active.color === color }"
            :style="{ background: color }"
            type="button"
            @click="pickColor(color)"
          ></button>
          <button class="ml-auto rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[var(--ink2)]" type="button" @click="togglePinned">
            {{ active.pinned ? '已置顶' : '置顶' }}
          </button>
        </div>
        <input v-model="active.title" class="mb-3 w-full bg-transparent text-[24px] font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" placeholder="无标题" @input="scheduleSave" />
        <textarea v-model="active.content" class="min-h-[44vh] w-full resize-none border-t border-black/10 bg-transparent pt-4 text-[15px] leading-[1.85] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" placeholder="写点什么..." @input="scheduleSave"></textarea>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <input v-model="active.folder" class="w-32 rounded-full border border-[var(--line2)] bg-white/70 px-3 py-1.5 text-xs outline-none" placeholder="文件夹" @input="scheduleSave" />
          <input v-model="tagsText" class="min-w-[180px] flex-1 rounded-full border border-[var(--line2)] bg-white/70 px-3 py-1.5 text-xs outline-none" placeholder="标签，用空格或 # 分隔" @change="commitTags" />
          <span class="text-xs text-[var(--muted)]">{{ saveState }}</span>
        </div>
      </div>

      <div v-if="aiLoading" class="rounded-xl border border-[var(--line2)] bg-white p-4 text-[13px] text-[var(--muted)] shadow-card">AI 生成中...</div>
      <div v-else-if="aiOpen" class="rounded-xl border border-[var(--line2)] bg-white p-4 shadow-card">
        <div class="max-h-[40vh] overflow-auto whitespace-pre-wrap text-[14px] leading-relaxed" :class="aiError ? 'text-[#b91c1c]' : 'text-[var(--ink)]'">{{ aiError || aiResult }}</div>
        <div class="mt-3 flex gap-2">
          <button class="rounded-[10px] bg-[var(--accent-d)] px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40" type="button" :disabled="!aiResult" @click="adoptAi">采用</button>
          <button class="rounded-[10px] bg-[#f3f3f4] px-4 py-2 text-[13px] font-semibold text-[var(--ink2)]" type="button" @click="dismissAi">关闭</button>
        </div>
      </div>

      <form class="flex items-center gap-2 rounded-full border border-[var(--line2)] bg-white py-1.5 pl-4 pr-1.5 shadow-card" @submit.prevent="askAi">
        <input v-model="aiPrompt" class="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" placeholder="让 AI 继续写、整理、提炼重点..." />
        <button class="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent-d)] text-white disabled:opacity-40" type="submit" :disabled="aiLoading || !aiPrompt.trim()">
          <ArrowUp class="h-4 w-4" />
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ArrowUp, ChevronLeft, Pin, Search, Trash2 } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';

const palette = ['#ffffff', '#fff7cc', '#fce7f3', '#dbeafe', '#dcfce7', '#f3e8ff', '#ffedd5'];
const notes = ref([]);
const query = ref('');
const active = ref(null);
const tagsText = ref('');
const saveState = ref('');
const toast = ref('');
const aiPrompt = ref('');
const aiResult = ref('');
const aiError = ref('');
const aiLoading = ref(false);
const aiOpen = ref(false);
let saveTimer = null;
let toastTimer = null;

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};
const load = async () => {
  const data = await request('/apps/notepad/notes');
  notes.value = data.notes || [];
  if (active.value) {
    const fresh = notes.value.find((item) => item.id === active.value.id);
    if (fresh) active.value = { ...fresh, tags: [...(fresh.tags || [])] };
  }
};
const filteredNotes = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return notes.value;
  return notes.value.filter((note) => [note.title, note.content, note.folder, ...(note.tags || [])].join(' ').toLowerCase().includes(q));
});
const firstLine = (text = '') => String(text).trim().split(/\r?\n/)[0] || '';
const showToast = (text) => {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.value = ''; }, 1800);
};
const openNote = (note) => {
  active.value = { ...note, tags: [...(note.tags || [])] };
  tagsText.value = active.value.tags.join(' ');
  aiPrompt.value = '';
  aiResult.value = '';
  aiError.value = '';
  aiOpen.value = false;
};
const newNote = async () => {
  const emojis = ['📝', '✨', '🌿', '🔖', '☁️', '🍞'];
  const data = await request('/apps/notepad/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '',
      content: '',
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      color: palette[Math.floor(Math.random() * palette.length)],
    }),
  });
  await load();
  openNote(data.note);
};
const saveNow = async () => {
  if (!active.value) return;
  clearTimeout(saveTimer);
  saveState.value = '保存中';
  const data = await request(`/apps/notepad/notes?id=${encodeURIComponent(active.value.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(active.value),
  });
  active.value = { ...data.note, tags: [...(data.note.tags || [])] };
  saveState.value = '已保存';
};
const scheduleSave = () => {
  saveState.value = '待保存';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveNow().catch((err) => { saveState.value = err.message || '保存失败'; }), 450);
};
const closeEditor = async () => {
  await saveNow().catch(() => {});
  active.value = null;
  await load();
};
const removeActive = async () => {
  if (!active.value) return;
  await request(`/apps/notepad/notes?id=${encodeURIComponent(active.value.id)}`, { method: 'DELETE' });
  active.value = null;
  await load();
  showToast('已删除');
};
const pickColor = (color) => {
  if (!active.value) return;
  active.value.color = color;
  scheduleSave();
};
const togglePinned = () => {
  if (!active.value) return;
  active.value.pinned = !active.value.pinned;
  scheduleSave();
};
const commitTags = () => {
  if (!active.value) return;
  active.value.tags = [...new Set(tagsText.value.split(/[#,，\s]+/).map((item) => item.trim()).filter(Boolean))];
  tagsText.value = active.value.tags.join(' ');
  scheduleSave();
};
const askAi = async () => {
  if (!active.value || aiLoading.value) return;
  const prompt = aiPrompt.value.trim();
  if (!prompt) return;
  aiLoading.value = true;
  aiOpen.value = false;
  aiResult.value = '';
  aiError.value = '';
  try {
    const data = await request('/apps/notepad/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'ask', prompt, content: active.value.content }),
    });
    aiResult.value = data.result?.content || '';
    aiPrompt.value = '';
  } catch (err) {
    aiError.value = err.message || 'AI 处理失败';
  } finally {
    aiLoading.value = false;
    aiOpen.value = true;
  }
};
const adoptAi = () => {
  if (!active.value || !aiResult.value) return;
  active.value.content = [active.value.content, aiResult.value].filter(Boolean).join('\n\n');
  aiOpen.value = false;
  aiResult.value = '';
  scheduleSave();
  showToast('已采用');
};
const dismissAi = () => {
  aiOpen.value = false;
  aiResult.value = '';
  aiError.value = '';
};

onMounted(load);
</script>
