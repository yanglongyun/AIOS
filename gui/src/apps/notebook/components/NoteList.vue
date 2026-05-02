<script setup>
import { ref, nextTick } from 'vue';
import NoteCard from './NoteCard.vue';
import FolderRow from './FolderRow.vue';

const props = defineProps({
  folders: { type: Array, default: () => [] },
  notes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits([
  'create-note', 'pin-note', 'remove-note', 'open-note',
  'create-folder', 'rename-folder', 'remove-folder', 'open-folder',
]);

const showNewFolder = ref(false);
const newFolderName = ref('');
const newFolderInput = ref(null);

const looseNotes = () => props.notes.filter((n) => !n.folderId);
const folderNoteCount = (fid) => props.notes.filter((n) => n.folderId === fid).length;

const startNewFolder = async () => {
  showNewFolder.value = true;
  await nextTick();
  newFolderInput.value?.focus();
};

const addFolder = () => {
  const name = newFolderName.value.trim();
  if (!name) { showNewFolder.value = false; return; }
  emit('create-folder', name);
  newFolderName.value = '';
  showNewFolder.value = false;
};
</script>

<template>
  <div class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
    <header class="flex flex-none items-center gap-3 px-8 pb-5 pt-8 max-md:px-4 max-md:pb-3 max-md:pt-5">
      <div class="flex-1">
        <h1 class="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink max-md:text-[26px]">__T_NOTEBOOK_LIST_TITLE__</h1>
        <p class="m-0 mt-1 text-[13px] text-faint">__T_NOTEBOOK_LIST_SUBTITLE__</p>
      </div>
      <button class="fab" @click="startNewFolder" title="__T_NOTEBOOK_NEW_FOLDER__">
        <span class="msi" style="font-size:20px">create_new_folder</span>
      </button>
      <button class="fab primary" @click="emit('create-note', null)" title="__T_NOTEBOOK_NEW_NOTE__">
        <span class="msi" style="font-size:22px">edit_note</span>
      </button>
    </header>

    <div v-if="error" class="mx-8 mb-3 rounded-lg px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
         style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">{{ error }}</div>

    <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
      <div v-if="loading && !notes.length && !folders.length" class="flex flex-col items-center gap-3 py-20 text-muted">
        <span class="msi" style="font-size:32px;color:var(--color-faint)">hourglass_empty</span>
        <div class="text-[14px]">__T_COMMON_LOADING__</div>
      </div>
      <div v-else-if="!folders.length && !looseNotes().length && !showNewFolder" class="empty-state">
        <div class="empty-illustration">
          <span class="msi" style="font-size:56px">auto_stories</span>
        </div>
        <div class="text-[15px] font-medium text-ink">__T_NOTEBOOK_EMPTY_START__</div>
        <div class="text-[13px] text-faint">__T_NOTEBOOK_EMPTY_HINT__</div>
      </div>

      <div v-else class="flex flex-col gap-3">
        <!-- New folder input -->
        <div v-if="showNewFolder" class="new-folder-input">
          <span class="msi flex-none text-accent" style="font-size:20px">create_new_folder</span>
          <input ref="newFolderInput" v-model="newFolderName" placeholder="__T_NOTEBOOK_FOLDER_PLACEHOLDER__"
            @keydown.enter="addFolder" @keydown.esc="showNewFolder = false" @blur="addFolder"
            class="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint" />
        </div>

        <!-- Folders -->
        <FolderRow v-for="f in folders" :key="'f-' + f.id"
          :folder="f" :note-count="folderNoteCount(f.id)"
          @click="emit('open-folder', $event)"
          @rename="(folder, name) => emit('rename-folder', folder, name)"
          @remove="emit('remove-folder', $event)" />

        <!-- Divider when both folders and notes exist -->
        <div v-if="folders.length && looseNotes().length" class="divider">
          <span class="divider-label">__T_NOTEBOOK_LOOSE_NOTES__</span>
        </div>

        <!-- Loose notes -->
        <NoteCard v-for="n in looseNotes()" :key="'n-' + n.id"
          :note="n"
          @click="emit('open-note', $event)"
          @pin="emit('pin-note', $event)"
          @remove="emit('remove-note', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fab {
  display: grid; place-items: center;
  width: 40px; height: 40px;
  border: 0; border-radius: 12px;
  background: var(--color-card);
  color: var(--color-muted);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04);
  transition: transform .15s, box-shadow .2s, color .12s;
}
.fab:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.06);
  color: var(--color-ink);
}
.fab.primary {
  background: var(--color-accent);
  color: white;
}
.fab.primary:hover { color: white; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 0;
}
.empty-illustration {
  width: 96px; height: 96px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-bg));
  color: var(--color-accent);
  margin-bottom: 8px;
}

.new-folder-input {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--color-card);
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  border: 1.5px dashed var(--color-accent);
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-line);
}
.divider-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-faint);
  letter-spacing: .04em;
  white-space: nowrap;
}
</style>
