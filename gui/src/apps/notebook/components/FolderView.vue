<script setup>
import NoteCard from './NoteCard.vue';

const props = defineProps({
  folder: { type: Object, default: null },
  notes: { type: Array, default: () => [] },
});
const emit = defineEmits(['back', 'create-note', 'pin-note', 'remove-note', 'open-note']);

const COLORS = ['#e8d5b7', '#c5ddd4', '#d4cde8', '#dde0c5', '#e8c5c5', '#c5d5e8'];
const folderColor = () => props.folder ? COLORS[props.folder.id % COLORS.length] : COLORS[0];
</script>

<template>
  <div class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
    <header class="folder-header" :style="{ '--folder-color': folderColor() }">
      <button class="back-btn" @click="emit('back')" title="__T_COMMON_BACK__">
        <span class="msi sm">arrow_back</span>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="m-0 truncate text-[28px] font-bold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">
          {{ folder?.name || '__T_NOTEBOOK_FOLDER_FALLBACK__' }}
        </h1>
        <p class="m-0 mt-0.5 text-[12px] text-muted">{{ '__T_NOTEBOOK_NOTE_COUNT__'.replace('{count}', notes.length) }}</p>
      </div>
      <button class="fab primary" @click="emit('create-note')" title="__T_NOTEBOOK_NEW_NOTE__">
        <span class="msi" style="font-size:22px">edit_note</span>
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-4 max-md:px-3 max-md:pb-10">
      <div v-if="!notes.length" class="flex flex-col items-center gap-3 py-20 text-muted">
        <div class="empty-folder">
          <span class="msi" style="font-size:40px">folder_open</span>
        </div>
        <div class="text-[14px]">__T_NOTEBOOK_FOLDER_EMPTY__</div>
      </div>

      <div v-else class="flex flex-col gap-3">
        <NoteCard v-for="n in notes" :key="n.id"
          :note="n"
          @click="emit('open-note', $event)"
          @pin="emit('pin-note', $event)"
          @remove="emit('remove-note', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 28px 32px 20px;
  border-bottom: 3px solid var(--folder-color, var(--color-line));
  background: linear-gradient(180deg, color-mix(in srgb, var(--folder-color, #ddd) 10%, var(--color-bg)) 0%, var(--color-bg) 100%);
}
@media (max-width: 768px) {
  .folder-header { padding: 20px 16px 16px; }
}

.back-btn {
  display: grid; place-items: center;
  width: 36px; height: 36px;
  border: 0; border-radius: 10px;
  background: var(--color-card);
  color: var(--color-muted);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: transform .12s, color .12s;
  flex: none;
}
.back-btn:hover { transform: translateY(-1px); color: var(--color-ink); }

.fab {
  display: grid; place-items: center;
  width: 40px; height: 40px;
  border: 0; border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04);
  transition: transform .15s, box-shadow .2s;
}
.fab.primary { background: var(--color-accent); color: white; }
.fab:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.06); }

.empty-folder {
  width: 80px; height: 80px;
  border-radius: 50%;
  display: grid; place-items: center;
  background: color-mix(in srgb, var(--folder-color, var(--color-accent)) 15%, var(--color-bg));
  color: var(--color-faint);
  margin-bottom: 4px;
}
</style>
