<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden" :style="bgStyle">
    <div v-if="!editing" class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 pb-24 [scrollbar-width:none]">
      <div class="mb-3 flex items-center justify-end">
        <span class="font-mono text-[10.5px] tracking-[0.08em] text-[#7a5e40]">{{ notes.length }} 篇笔记</span>
      </div>

      <div class="relative mb-3">
        <Search :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7850]" />
        <input
          v-model="search"
          class="w-full rounded-[12px] border border-[rgba(120,90,40,0.28)] bg-[#e4dcc8] py-2.5 pl-10 pr-3 text-[13.5px] text-[#3a2415] shadow-[inset_0_2px_6px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.5)] outline-none placeholder:text-[#b09870]"
          placeholder="搜索笔记..."
        />
      </div>

      <div v-if="!filteredNotes.length" class="flex flex-col items-center gap-2 py-16 text-center text-[#9a8060]">
        <div class="grid h-14 w-14 place-items-center rounded-[16px] text-[28px]" :style="emptyIconStyle">📝</div>
        <div class="text-[14px] font-bold text-[#5a4030]">{{ search.trim() ? '没有匹配的笔记' : '还没有笔记' }}</div>
        <div class="text-[12px]">{{ search.trim() ? '换个关键词试试' : '点右下角写下第一篇' }}</div>
      </div>

      <div v-else class="flex flex-col gap-2.5">
        <button
          v-for="note in filteredNotes"
          :key="note.id"
          type="button"
          class="w-full rounded-[14px] px-3.5 py-3 text-left active:translate-y-[1px]"
          :style="panelStyle"
          @click="openEditor(note)"
        >
          <div class="line-clamp-1 text-[15px] font-extrabold leading-snug text-[#3a2415]">
            {{ note.title || firstLine(note.content) || '无标题' }}
          </div>
          <div
            v-if="note.content"
            class="mt-1.5 line-clamp-2 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#7a5e40]"
          >
            {{ note.content }}
          </div>
          <div class="mt-2 flex items-center gap-2">
            <span class="rounded-full bg-[rgba(200,148,28,0.14)] px-2 py-0.5 text-[10px] font-bold text-[#a07010]">笔记</span>
            <span class="font-mono text-[10px] text-[#9a8060]">{{ note.updated_at || note.created_at }}</span>
          </div>
        </button>
      </div>
    </div>

    <button
      v-if="!editing"
      type="button"
      class="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-[14px] px-4 py-3 text-[14px] font-bold text-[rgba(255,245,200,0.96)] active:translate-y-[2px]"
      :style="fabStyle"
      @click="openEditor()"
    >
      <Plus :size="19" :stroke-width="2.6" />
      新笔记
    </button>

    <div
      v-if="editing"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
      :style="detailStyle"
    >
      <div class="flex h-[50px] shrink-0 items-center gap-2 border-b border-[rgba(120,90,40,0.16)] px-3">
        <button class="grid h-9 w-9 place-items-center rounded-[10px] text-[#7a5e40] active:bg-[rgba(120,90,40,0.08)]" type="button" aria-label="返回笔记列表" @click="closeEditor">
          <ChevronLeft :size="21" />
        </button>
        <div class="min-w-0 flex-1 truncate text-[17px] font-extrabold text-[#3a2415]">{{ editing.id ? '编辑笔记' : '新笔记' }}</div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-3.5 py-3.5 pb-28 [scrollbar-width:none]">
        <input
          v-model="form.title"
          class="mb-3 w-full rounded-[12px] border-0 bg-white/45 px-3 py-3 text-[18px] font-extrabold text-[#3a2415] outline-none placeholder:text-[#b09870]"
          placeholder="标题"
        />
        <textarea
          v-model="form.content"
          rows="7"
          class="w-full resize-none rounded-[12px] border border-[rgba(120,90,40,0.28)] bg-[#e4dcc8] px-3 py-3 text-[14px] leading-relaxed text-[#3a2415] shadow-[inset_0_2px_6px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.5)] outline-none placeholder:text-[#b09870]"
          placeholder="写点什么..."
        />

        <div class="mt-4 rounded-[14px] px-3.5 py-3" :style="aiCardStyle">
          <div class="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#a07010]">
            <Sparkles :size="14" />
            AI 润色
          </div>
          <div class="mb-3 grid grid-cols-3 gap-2">
            <button
              v-for="mode in aiModes"
              :key="mode.id"
              type="button"
              class="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[12px] px-2.5 py-2 text-[12.5px] font-bold text-[rgba(255,245,200,0.96)] disabled:opacity-45"
              :style="buttonStyle"
              :disabled="aiBusy || !form.content.trim()"
              @click="runAi(mode.id)"
            >
              <component :is="mode.icon" :size="14" />
              <span class="truncate">{{ aiBusy && aiMode === mode.id ? '处理中' : mode.label }}</span>
            </button>
          </div>

          <div v-if="aiBusy" class="mb-3 flex items-center gap-2 rounded-[13px] border border-[rgba(200,148,28,0.30)] px-3.5 py-3" :style="aiPanelStyle">
            <Sparkles :size="18" class="animate-spin text-[#a07010]" />
            <span class="text-[13px] font-bold text-[#a07010]">{{ activeAiLabel }}中...</span>
          </div>

          <div v-if="aiResult && !aiBusy" class="mb-3 overflow-hidden rounded-[14px] border border-[rgba(200,148,28,0.35)]" :style="aiPanelStyle">
            <div class="flex items-center gap-1.5 border-b border-[rgba(200,148,28,0.22)] px-3 py-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#a07010]">
              <Sparkles :size="14" />
              AI {{ activeAiLabel }}结果
            </div>
            <div class="whitespace-pre-wrap px-3.5 py-3 text-[13.5px] leading-relaxed text-[#3a2415]">{{ aiResult }}</div>
            <div class="flex gap-2 px-3.5 pb-3">
              <button class="flex-1 rounded-[11px] py-2 text-[13px] font-bold text-[rgba(255,245,200,0.96)] active:translate-y-[1px]" type="button" :style="buttonStyle" @click="acceptAi">采纳</button>
              <button class="rounded-[11px] border border-[rgba(120,90,40,0.30)] bg-white/45 px-4 py-2 text-[13px] font-bold text-[#7a5e40]" type="button" @click="aiResult = ''">放弃</button>
            </div>
          </div>

          <div v-if="error" class="mb-3 rounded-[12px] border border-[rgba(168,58,40,0.28)] bg-[rgba(168,58,40,0.08)] px-3 py-2 text-[12px] leading-relaxed text-[#9a3a2a]">
            {{ error }}
          </div>
        </div>

      </div>

      <div class="absolute inset-x-0 bottom-0 z-10 border-t border-[rgba(120,90,40,0.16)] px-3.5 py-3" :style="actionBarStyle">
        <div class="flex gap-2">
            <button
              v-if="editing.id"
              class="grid h-11 w-11 place-items-center rounded-[12px] border border-[rgba(168,58,40,0.30)] bg-white/40 text-[#9a3a2a]"
              type="button"
              aria-label="删除笔记"
              @click="remove(editing.id)"
            >
              <Trash2 :size="18" />
            </button>
            <button
              class="h-11 flex-1 rounded-[12px] text-[14px] font-bold text-[rgba(255,245,200,0.96)] disabled:opacity-45"
              type="button"
              :style="buttonStyle"
              :disabled="saving || (!form.title.trim() && !form.content.trim())"
              @click="save"
            >
              {{ saving ? '保存中...' : editing.id ? '保存' : '创建' }}
            </button>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ChevronLeft, Expand, Plus, Scissors, Search, Sparkles, Trash2, WandSparkles } from 'lucide-vue-next';

const notes = ref([]);
const search = ref('');
const editing = ref(null);
const saving = ref(false);
const aiBusy = ref(false);
const aiMode = ref('polish');
const aiResult = ref('');
const error = ref('');

const form = reactive({
  title: '',
  content: '',
});

const aiModes = [
  { id: 'polish', label: '润色', icon: WandSparkles },
  { id: 'condense', label: '精简', icon: Scissors },
  { id: 'expand', label: '扩写', icon: Expand },
];

const activeAiLabel = computed(() => aiModes.find((mode) => mode.id === aiMode.value)?.label || '润色');
const filteredNotes = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return notes.value;
  return notes.value.filter((note) => `${note.title || ''}\n${note.content || ''}`.toLowerCase().includes(q));
});

const firstLine = (text = '') => String(text).trim().split(/\r?\n/)[0] || '';

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/notepad/notes');
  notes.value = data.notes || [];
};

const resetAi = () => {
  aiBusy.value = false;
  aiResult.value = '';
  error.value = '';
  aiMode.value = 'polish';
};

const openEditor = (note = null) => {
  editing.value = note ? { ...note } : {};
  form.title = note?.title || '';
  form.content = note?.content || '';
  resetAi();
};

const closeEditor = () => {
  if (aiBusy.value || saving.value) return;
  editing.value = null;
  resetAi();
};

const runAi = async (mode = 'polish') => {
  const content = form.content.trim();
  if (!content || aiBusy.value) return;
  aiMode.value = mode;
  aiBusy.value = true;
  aiResult.value = '';
  error.value = '';
  try {
    const data = await request('/apps/notepad/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, content }),
    });
    aiResult.value = data.result?.content || '';
    if (!aiResult.value) error.value = '没有生成可用结果';
  } catch (err) {
    error.value = err.message || 'AI 处理失败';
  } finally {
    aiBusy.value = false;
  }
};

const acceptAi = () => {
  if (!aiResult.value) return;
  form.content = aiResult.value;
  aiResult.value = '';
};

const save = async () => {
  if (saving.value) return;
  const content = form.content.trim();
  const title = form.title.trim() || firstLine(content).slice(0, 24) || '无标题';
  if (!title && !content) return;
  saving.value = true;
  error.value = '';
  try {
    const payload = { title, content };
    if (editing.value?.id) {
      await request(`/apps/notepad/notes?id=${encodeURIComponent(editing.value.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await request('/apps/notepad/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    editing.value = null;
    resetAi();
    await load();
  } catch (err) {
    error.value = err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

const remove = async (id) => {
  if (saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    await request(`/apps/notepad/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    editing.value = null;
    resetAi();
    await load();
  } catch (err) {
    error.value = err.message || '删除失败';
  } finally {
    saving.value = false;
  }
};

onMounted(load);

const bgStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 3px 12px rgba(90,60,20,0.13),0 1px 3px rgba(90,60,20,0.10),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.20)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 2px 6px rgba(160,112,16,0.30),inset 0 1px 0 rgba(255,215,80,0.40)',
};
const fabStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 4px 0 #6a4800,0 6px 14px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,215,80,0.40)',
};
const detailStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,#f4ecd8 0%,#ece2c8 100%)',
};
const aiPanelStyle = {
  background: 'linear-gradient(160deg,#fdf6e3 0%,#f5ebd0 100%)',
  boxShadow: '0 4px 14px rgba(160,112,16,0.16),inset 0 1px 0 rgba(255,255,255,0.70)',
};
const aiCardStyle = {
  background: 'linear-gradient(160deg,rgba(253,246,227,0.72) 0%,rgba(245,235,208,0.72) 100%)',
  border: '1px solid rgba(200,148,28,0.24)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.62)',
};
const actionBarStyle = {
  background:
    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'>' +
      '<filter id=\'n\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/>' +
      '<feColorMatrix type=\'saturate\' values=\'0\'/></filter>' +
      '<rect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'0.04\'/></svg>"), ' +
    'linear-gradient(180deg,rgba(244,236,216,0.94) 0%,rgba(236,226,200,0.98) 100%)',
  boxShadow: '0 -8px 20px rgba(90,60,20,0.12)',
};
const emptyIconStyle = {
  background: 'linear-gradient(160deg,#e0b35c,#a87312)',
  boxShadow: '0 4px 12px rgba(90,60,20,0.22),inset 0 1px 0 rgba(255,255,255,0.85)',
};
</script>
