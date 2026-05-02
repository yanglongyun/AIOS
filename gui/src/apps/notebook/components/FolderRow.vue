<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  folder: { type: Object, required: true },
  noteCount: { type: Number, default: 0 },
});
const emit = defineEmits(['click', 'rename', 'remove']);

const renaming = ref(false);
const renameValue = ref('');
const renameInput = ref(null);

const startRename = async () => {
  renaming.value = true;
  renameValue.value = props.folder.name;
  await nextTick();
  renameInput.value?.focus();
};

const finishRename = () => {
  const name = renameValue.value.trim();
  renaming.value = false;
  if (name && name !== props.folder.name) {
    emit('rename', props.folder, name);
  }
};

const COLORS = ['#e8d5b7', '#c5ddd4', '#d4cde8', '#dde0c5', '#e8c5c5', '#c5d5e8'];
const folderColor = () => COLORS[props.folder.id % COLORS.length];
</script>

<template>
  <div class="folder-row group/f" @click="emit('click', folder)">
    <!-- Tab -->
    <div class="folder-tab" :style="{ background: folderColor() }">
      <span class="tab-label">{{ folder.name.slice(0, 2) }}</span>
    </div>

    <!-- Body -->
    <div class="folder-body" :style="{ borderTopColor: folderColor() }">
      <span v-if="renaming" class="flex min-w-0 flex-1 items-center">
        <input ref="renameInput" v-model="renameValue"
          @blur="finishRename" @keydown.enter="finishRename" @keydown.esc="renaming = false"
          @click.stop
          class="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] font-medium text-ink outline-none" />
      </span>
      <template v-else>
        <div class="min-w-0 flex-1">
          <div class="folder-name">{{ folder.name }}</div>
          <div class="folder-count">{{ '__T_NOTEBOOK_NOTE_COUNT__'.replace('{count}', noteCount) }}</div>
        </div>
        <div class="folder-actions">
          <button class="f-btn" @click.stop="startRename" title="__T_NOTEBOOK_RENAME__">
            <span class="msi sm">edit</span>
          </button>
          <button class="f-btn danger" @click.stop="emit('remove', folder)" title="__T_COMMON_DELETE__">
            <span class="msi sm">delete</span>
          </button>
        </div>
        <span class="msi text-faint" style="font-size:18px">chevron_right</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.folder-row {
  position: relative;
  cursor: pointer;
  transition: transform .15s;
}
.folder-row:hover { transform: translateY(-1px); }

.folder-tab {
  width: 56px;
  height: 18px;
  border-radius: 6px 10px 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 14px;
  position: relative;
  z-index: 1;
}
.tab-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(0,0,0,.45);
  letter-spacing: .02em;
}

.folder-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  border-top: 3px solid;
  background: var(--color-card);
  box-shadow:
    0 1px 2px rgba(0,0,0,.05),
    0 4px 12px rgba(0,0,0,.03),
    inset 0 1px 0 rgba(255,255,255,.4);
  transition: box-shadow .2s;
}
.folder-row:hover .folder-body {
  box-shadow:
    0 2px 6px rgba(0,0,0,.07),
    0 8px 20px rgba(0,0,0,.05),
    inset 0 1px 0 rgba(255,255,255,.4);
}

.folder-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--color-ink);
}
.folder-count {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-faint);
}

.folder-actions {
  display: flex; gap: 2px;
  opacity: 0;
  transition: opacity .15s;
}
.group\/f:hover .folder-actions { opacity: 1; }

.f-btn {
  display: grid; place-items: center;
  width: 28px; height: 28px;
  border: 0; border-radius: 6px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition: background .12s, color .12s;
}
.f-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.f-btn.danger:hover { color: var(--color-bad); }
</style>
