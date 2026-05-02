<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  folder: { type: Object, default: null },
  notes: { type: Array, default: () => [] },
});
const emit = defineEmits(['back', 'create-note', 'open-note', 'update-folder', 'remove-folder']);

const nameInput = ref('');
const editing = ref(false);

const startEdit = () => {
  nameInput.value = props.folder?.name || '';
  editing.value = true;
  nextTick(() => document.querySelector('.folder-title-input')?.focus());
};

const saveName = () => {
  editing.value = false;
  const name = nameInput.value.trim();
  if (name && name !== props.folder?.name) {
    emit('update-folder', { id: props.folder.id, name });
  }
};

function fmtTime(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T') + 'Z');
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '__T_NOTEBOOK_JUST_NOW__';
  if (diff < 3600) return `${Math.floor(diff / 60)} __T_NOTEBOOK_MINUTES_AGO__`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} __T_NOTEBOOK_HOURS_AGO__`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} __T_NOTEBOOK_DAYS_AGO__`;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
</script>

<template>
  <div class="mx-auto w-full min-w-0 max-w-[820px] px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-10">
    <button class="mb-2 rounded px-1.5 py-1 text-sm text-faint hover:bg-bg-hi hover:text-muted"
      @click="emit('back')">
      ← __T_NOTEBOOK_TITLE__
    </button>

    <div v-if="folder?.icon" class="mt-2">
      <span class="text-[56px] leading-none">{{ folder.icon }}</span>
    </div>

    <input v-if="editing"
      v-model="nameInput"
      class="folder-title-input mt-2 w-full border-0 bg-transparent py-1 text-[40px] font-bold leading-tight tracking-tight text-ink outline-none placeholder:text-hint"
      @blur="saveName"
      @keydown.enter.prevent="saveName" />
    <h1 v-else
      class="mt-2 cursor-text py-1 text-[40px] font-bold leading-tight tracking-tight text-ink"
      @click="startEdit">
      {{ folder?.name || '__T_NOTEBOOK_UNTITLED__' }}
    </h1>

    <div class="mt-1 flex items-center gap-1 text-faint">
      <button class="rounded px-1.5 py-1 text-sm hover:bg-bg-hi hover:text-muted"
        @click="emit('remove-folder', folder)">
        __T_COMMON_DELETE__
      </button>
    </div>

    <div class="mt-6 flex flex-col">
      <div v-for="n in notes" :key="n.id"
        class="item-row" @click="emit('open-note', n)">
        <span class="item-icon">{{ n.icon || '📄' }}</span>
        <span class="item-text">{{ n.title || '__T_NOTEBOOK_UNTITLED__' }}</span>
        <span class="item-hint">{{ fmtTime(n.updatedAt) }}</span>
      </div>

      <div v-if="!notes.length" class="py-10 text-sm text-faint">
        __T_NOTEBOOK_FOLDER_EMPTY__
      </div>

      <button class="add-row mt-3" @click="emit('create-note')">
        <span class="add-icon">＋</span>
        <span>__T_NOTEBOOK_NEW_NOTE__</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.item-row {
  display: flex; align-items: center; gap: 8px;
  min-height: 28px; padding: 4px 6px;
  border-radius: 4px; cursor: pointer;
  transition: background .08s;
}
.item-row:hover { background: var(--color-bg-hi); }

.item-icon {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex: none;
}
.item-text {
  flex: 1; min-width: 0;
  font-size: 14px; color: var(--color-ink);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.item-hint {
  font-size: 12px; color: var(--color-faint); flex: none;
}

.add-row {
  display: flex; align-items: center; gap: 6px;
  min-height: 28px; padding: 4px 6px;
  border-radius: 4px; cursor: pointer;
  font-size: 14px; color: var(--color-faint);
  border: 0; background: transparent; width: 100%; text-align: left;
  transition: background .08s, color .08s;
}
.add-row:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.add-icon { width: 20px; text-align: center; font-size: 14px; }
</style>
