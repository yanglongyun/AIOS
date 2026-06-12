<template>
  <div class="np-app absolute inset-0 overflow-y-auto dot-grid" :data-theme="themeName">
    <ListView
      v-if="!active"
      v-model:query="query"
      :notes="filteredNotes"
      @new="newNote"
      @open="openNote"
    />
    <EditorView
      v-else
      v-model:ai-prompt="aiPrompt"
      :note="active"
      :ai-loading="aiLoading"
      :ai-open="aiOpen"
      :ai-result="aiResult"
      :ai-error="aiError"
      @close="closeEditor"
      @remove="removeActive"
      @schedule-save="scheduleSave"
      @pick-color="pickColor"
      @ask="askAi"
      @adopt="adoptAi"
      @dismiss="dismissAi"
    />

    <div class="toast" :class="{ show: toastText }">{{ toastText }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';
import ListView from './views/ListView.vue';
import EditorView from './views/EditorView.vue';
import { request } from './lib/api.js';
import { PALETTE } from './lib/format.js';

const theme = useThemeStore();
const themeName = computed(() => theme.resolved === 'dark' ? 'dark' : 'light');
const notes = ref([]);
const folders = ref([]);
const query = ref('');
const activeFolder = ref('all');
const activeTag = ref('');
const active = ref(null);
const preview = ref(false);
const saving = ref(false);
const aiPrompt = ref('');
const aiResult = ref('');
const aiError = ref('');
const aiLoading = ref(false);
const aiOpen = ref(false);
const toastText = ref('');
let saveTimer = null;
let toastTimer = null;

const load = async () => {
  const data = await request('/apps/notepad/notes');
  notes.value = data.notes || [];
  folders.value = data.folders || [];
  if (active.value) {
    const fresh = notes.value.find((item) => item.id === active.value.id);
    if (fresh) active.value = { ...fresh, tags: [...fresh.tags] };
  }
};

const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 5 ? '__T_COMMON_GREETING_NIGHT__' : h < 11 ? '__T_COMMON_GREETING_MORNING__' : h < 13 ? '__T_COMMON_GREETING_NOON__' : h < 18 ? '__T_COMMON_GREETING_AFTERNOON__' : '__T_COMMON_GREETING_EVENING__';
});
const todayLabel = computed(() => new Date().toLocaleDateString('__T__LOCALE_FULL__', { month: 'long', day: 'numeric' }));
const weekCount = computed(() => notes.value.filter((n) => Date.now() - new Date(n.updated_at).getTime() < 7 * 86400000).length);
const folderChips = computed(() => {
  const base = [
    { key: 'all', label: '__T_COMMON_ALL__', count: notes.value.length },
    { key: 'pinned', label: '__T_NOTEPAD_PINNED__', count: notes.value.filter((n) => n.pinned).length },
  ];
  return base.concat(folders.value.map((folder) => ({
    key: folder.name,
    label: folder.name,
    color: folder.color,
    count: notes.value.filter((n) => n.folder === folder.name).length,
  })));
});
const tagChips = computed(() => [...new Set(notes.value.flatMap((n) => n.tags || []))]);
const filteredNotes = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value.filter((note) => {
    if (activeFolder.value === 'pinned' && !note.pinned) return false;
    if (activeFolder.value !== 'all' && activeFolder.value !== 'pinned' && note.folder !== activeFolder.value) return false;
    if (activeTag.value && !note.tags.includes(activeTag.value)) return false;
    if (!q) return true;
    return [note.title, note.content, ...(note.tags || [])].join(' ').toLowerCase().includes(q);
  });
});
const charCount = computed(() => active.value ? active.value.content.replace(/\s/g, '').length : 0);
const readMinutes = computed(() => Math.max(1, Math.ceil(charCount.value / 450)));
const docDate = computed(() => active.value ? new Date(active.value.updated_at || Date.now()).toLocaleDateString('__T__LOCALE_FULL__') : '');

const showToast = (text) => {
  toastText.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastText.value = ''; }, 1800);
};

const openNote = (note) => {
  active.value = { ...note, tags: [...(note.tags || [])] };
  preview.value = false;
  aiOpen.value = false;
  aiResult.value = '';
  aiError.value = '';
  aiPrompt.value = '';
};
const closeEditor = async () => {
  await saveNow();
  active.value = null;
  await load();
};
const newNote = async () => {
  const emojis = ['📝', '✨', '🌿', '🔖', '🫧', '🍞'];
  const data = await request('/apps/notepad/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '',
      content: '',
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    }),
  });
  await load();
  openNote(data.note);
};
const patchActive = async (patch) => {
  if (!active.value) return;
  active.value = { ...active.value, ...patch };
  await saveNow();
};
const scheduleSave = () => {
  saving.value = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 450);
};
const saveNow = async () => {
  if (!active.value) return;
  clearTimeout(saveTimer);
  await request(`/apps/notepad/notes?id=${active.value.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(active.value),
  });
  saving.value = false;
};
const removeActive = async () => {
  if (!active.value || !confirm('__T_NOTEPAD_CONFIRM_DELETE__')) return;
  await request(`/apps/notepad/notes?id=${active.value.id}`, { method: 'DELETE' });
  active.value = null;
  await load();
  showToast('__T_COMMON_DELETED__');
};
const addFolder = async () => {
  const name = prompt('__T_NOTEPAD_NEW_FOLDER_PROMPT__');
  if (!name?.trim()) return;
  await request('/apps/notepad/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() }),
  });
  await load();
};
const addTag = () => {
  if (!active.value) return;
  const tag = prompt('__T_NOTEPAD_NEW_TAG_PROMPT__');
  if (!tag?.trim()) return;
  active.value.tags = [...new Set([...(active.value.tags || []), tag.trim().replace(/^#/, '')])];
  scheduleSave();
};
const removeTag = (tag) => {
  active.value.tags = active.value.tags.filter((item) => item !== tag);
  scheduleSave();
};

const pickColor = (c) => {
  if (!active.value) return;
  active.value.color = c;
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
    aiError.value = `${'__T_COMMON_ERROR__'}: ${err.message}`;
  } finally {
    aiLoading.value = false;
    aiOpen.value = true;
  }
};
const adoptAi = () => {
  if (!active.value || !aiResult.value) return;
  active.value.content += '\n\n' + aiResult.value;
  scheduleSave();
  aiOpen.value = false;
  aiResult.value = '';
  showToast('__T_NOTEPAD_ADOPTED__');
};
const dismissAi = () => {
  aiOpen.value = false;
  aiResult.value = '';
  aiError.value = '';
};

onMounted(load);
</script>

<style scoped>
.np-app{--panel:var(--color-bg-elev);--ink:var(--color-ink);--ink2:var(--color-muted);--muted:var(--color-faint);--line:var(--color-line);--line2:var(--color-line-hi);--accent:var(--color-accent);color:var(--ink)}
.icon{display:grid;place-items:center;border:0;background:transparent;border-radius:8px;color:var(--ink2);font-weight:600;min-width:30px;height:30px;cursor:pointer}
.icon:hover{background:var(--color-bg-hi);color:var(--ink)}
.toast{position:fixed;top:12px;left:50%;transform:translate(-50%,-180%);opacity:0;visibility:hidden;transition:transform .25s,opacity .25s,visibility .25s;z-index:30;background:var(--color-ink);color:var(--color-bg);border-radius:999px;padding:8px 14px;font-size:12px;font-weight:600}
.toast.show{transform:translate(-50%,0);opacity:1;visibility:visible}
</style>
