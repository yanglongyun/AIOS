<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ItemList from './components/ItemList.vue';
import FolderView from './components/FolderView.vue';
import NoteEditor from './components/NoteEditor.vue';

const route = useRoute();
const router = useRouter();

const view = computed(() => {
  const p1 = route.params.p1;
  const p2 = route.params.p2;
  if (!p1) return 'list';
  if (p1 === 'f' && p2) return 'folder';
  return 'edit';
});
const routeNoteId   = computed(() => view.value === 'edit' ? Number(route.params.p1) || null : null);
const routeFolderId = computed(() => view.value === 'folder' ? Number(route.params.p2) || null : null);

const goRoot   = () => router.push('/app/notebook');
const goFolder = (id) => router.push(`/app/notebook/f/${id}`);
const goEdit   = (id) => router.push(`/app/notebook/${id}`);

// ---- Data --------------------------------------------------------------

const folders = ref([]);
const notes   = ref([]);
const loading = ref(false);
const error   = ref('');
const saving  = ref(false);
const polishing = ref(false);
const polishResult = ref('');

const api = async (path, options = {}) => {
  const res = await fetch(`/apps/notebook${path}`, {
    ...options,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
};

const fetchAll = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [f, n] = await Promise.all([api('/folders/list'), api('/list')]);
    folders.value = f.items || [];
    notes.value = n.items || [];
  } catch (e) { error.value = e.message; }
  finally { loading.value = false; }
};

const getNote = (id) => notes.value.find((n) => n.id === id) || null;
const currentNote   = computed(() => routeNoteId.value ? getNote(routeNoteId.value) : null);
const currentFolder = computed(() => routeFolderId.value ? folders.value.find((f) => f.id === routeFolderId.value) : null);
const folderNotes   = computed(() => routeFolderId.value ? notes.value.filter((n) => n.folderId === routeFolderId.value) : []);

// ---- Folder actions ----------------------------------------------------

const createFolder = async () => {
  const name = prompt('__T_NOTEBOOK_FOLDER_PLACEHOLDER__');
  if (!name?.trim()) return;
  try {
    const data = await api('/folders/create', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
    folders.value.push(data.item);
  } catch (e) { error.value = e.message; }
};

const updateFolder = async (patch) => {
  try {
    const data = await api('/folders/update', { method: 'POST', body: JSON.stringify(patch) });
    const idx = folders.value.findIndex((x) => x.id === patch.id);
    if (idx >= 0) folders.value[idx] = data.item;
  } catch (e) { error.value = e.message; }
};

const removeFolder = async (folder) => {
  try {
    await api('/folders/delete', { method: 'POST', body: JSON.stringify({ id: folder.id }) });
    folders.value = folders.value.filter((x) => x.id !== folder.id);
    for (const n of notes.value) {
      if (n.folderId === folder.id) n.folderId = null;
    }
    if (routeFolderId.value === folder.id) goRoot();
  } catch (e) { error.value = e.message; }
};

// ---- Note actions ------------------------------------------------------

const createNote = async (folderId) => {
  try {
    const data = await api('/create', {
      method: 'POST',
      body: JSON.stringify({ title: '', folderId }),
    });
    notes.value.unshift(data.item);
    goEdit(data.item.id);
  } catch (e) { error.value = e.message; }
};

const removeNote = async (note) => {
  try {
    await api('/delete', { method: 'POST', body: JSON.stringify({ id: note.id }) });
    notes.value = notes.value.filter((n) => n.id !== note.id);
    if (routeNoteId.value === note.id) goRoot();
  } catch (e) { error.value = e.message; }
};

const saveField = async (id, patch) => {
  if (patch._local) {
    const idx = notes.value.findIndex((n) => n.id === id);
    if (idx >= 0) {
      const updates = {};
      if ('content' in patch) updates.content = patch.content;
      if ('title' in patch) updates.title = patch.title;
      notes.value[idx] = { ...notes.value[idx], ...updates };
    }
    return;
  }
  saving.value = true;
  try {
    const data = await api('/update', { method: 'POST', body: JSON.stringify({ id, ...patch }) });
    const idx = notes.value.findIndex((n) => n.id === id);
    if (idx >= 0) notes.value[idx] = data.item;
  } catch (e) { error.value = e.message; }
  finally { saving.value = false; }
};

// ---- Polish ------------------------------------------------------------

const doPolish = async (note) => {
  if (polishing.value) return;
  polishing.value = true;
  polishResult.value = '';
  try {
    const data = await api('/polish', { method: 'POST', body: JSON.stringify({ id: note.id }) });
    polishResult.value = data.polished || '';
  } catch (e) { error.value = e.message; }
  finally { polishing.value = false; }
};

const applyPolish = async (note) => {
  if (!polishResult.value) return;
  await saveField(note.id, { content: polishResult.value });
  polishResult.value = '';
};

const dismissPolish = () => { polishResult.value = ''; };

watch(routeNoteId, () => {
  polishResult.value = '';
  polishing.value = false;
});

onMounted(fetchAll);
</script>

<template>
  <div class="flex h-full bg-bg">
    <ItemList v-if="view === 'list'"
      :folders="folders" :notes="notes" :loading="loading" :error="error"
      @create-note="createNote(null)"
      @open-note="(n) => goEdit(n.id)"
      @create-folder="createFolder"
      @open-folder="(f) => goFolder(f.id)" />

    <FolderView v-else-if="view === 'folder'"
      :folder="currentFolder" :notes="folderNotes"
      @back="goRoot"
      @create-note="createNote(routeFolderId)"
      @open-note="(n) => goEdit(n.id)"
      @update-folder="updateFolder"
      @remove-folder="removeFolder" />

    <NoteEditor v-else-if="view === 'edit' && currentNote"
      :note="currentNote" :saving="saving" :polishing="polishing" :polish-result="polishResult"
      @back="currentNote.folderId ? goFolder(currentNote.folderId) : goRoot()"
      @save="saveField"
      @remove="removeNote"
      @polish="doPolish"
      @apply-polish="applyPolish"
      @dismiss-polish="dismissPolish" />

    <div v-else class="flex h-full w-full items-center justify-center text-muted">
      <span class="msi mr-2" style="font-size:20px">hourglass_empty</span>__T_COMMON_LOADING__
    </div>
  </div>
</template>
