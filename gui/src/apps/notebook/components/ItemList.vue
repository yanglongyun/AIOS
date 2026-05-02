<script setup>
const props = defineProps({
  folders: { type: Array, default: () => [] },
  notes: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits([
  'create-note', 'open-note',
  'create-folder', 'open-folder',
]);

const looseNotes = () => props.notes.filter((n) => !n.folderId);
const folderNoteCount = (fid) => props.notes.filter((n) => n.folderId === fid).length;
</script>

<template>
  <div class="mx-auto w-full min-w-0 max-w-[820px] px-12 pt-10 pb-20 max-md:px-5 max-md:pt-6 max-md:pb-10">
    <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ink max-md:text-[19px]">__T_NOTEBOOK_TITLE__</h1>

    <div v-if="error" class="mt-4 text-sm text-bad">{{ error }}</div>

    <div v-if="loading && !notes.length && !folders.length" class="py-16 text-sm text-faint">
      __T_COMMON_LOADING__
    </div>

    <div v-else class="mt-6 flex flex-col">
      <!-- Folders -->
      <div v-for="f in folders" :key="'f-' + f.id"
        class="item-row" @click="emit('open-folder', f)">
        <span class="item-icon">{{ f.icon || '📁' }}</span>
        <span class="item-text">{{ f.name }} <span class="text-faint">/</span></span>
        <span class="item-hint">{{ folderNoteCount(f.id) }}</span>
      </div>

      <!-- Loose notes -->
      <div v-for="n in looseNotes()" :key="'n-' + n.id"
        class="item-row" @click="emit('open-note', n)">
        <span class="item-icon">{{ n.icon || '📄' }}</span>
        <span class="item-text">{{ n.title || '__T_NOTEBOOK_UNTITLED__' }}</span>
        <span class="item-hint">{{ fmtTime(n.updatedAt) }}</span>
      </div>

      <!-- Empty -->
      <div v-if="!folders.length && !looseNotes().length" class="py-10 text-sm text-faint">
        __T_NOTEBOOK_EMPTY__
      </div>

      <!-- Add buttons -->
      <div class="mt-3 flex flex-col gap-0.5">
        <button class="add-row" @click="emit('create-folder')">
          <span class="add-icon">＋</span>
          <span>__T_NOTEBOOK_NEW_FOLDER__</span>
        </button>
        <button class="add-row" @click="emit('create-note', null)">
          <span class="add-icon">＋</span>
          <span>__T_NOTEBOOK_NEW_NOTE__</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
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
