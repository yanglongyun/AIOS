<script setup>
import { ref } from 'vue';

const props = defineProps({
  onInsertImage: { type: Function, default: null },
});

const fileInput = ref(null);

function exec(cmd, arg) {
  document.execCommand(cmd, false, arg || null);
}

function onImage() {
  document.querySelector('.nb-file-input')?.click();
}

function onFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file && props.onInsertImage) props.onInsertImage(file);
}
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3"
    :style="{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }">
    <div class="bt-inner pointer-events-auto">
      <button class="bt-btn" style="font-weight:700" title="H1"
        @mousedown.prevent @click="exec('formatBlock', 'H1')">H1</button>
      <button class="bt-btn" style="font-weight:600" title="H2"
        @mousedown.prevent @click="exec('formatBlock', 'H2')">H2</button>
      <button class="bt-btn" title="H3"
        @mousedown.prevent @click="exec('formatBlock', 'H3')">H3</button>
      <button class="bt-btn" title="__T_NOTEBOOK_BODY_TEXT__"
        @mousedown.prevent @click="exec('formatBlock', 'DIV')">__T_NOTEBOOK_BODY_TEXT__</button>
      <span class="bt-sep"></span>
      <button class="bt-btn" style="font-weight:700" title="__T_NOTEBOOK_BOLD__"
        @mousedown.prevent @click="exec('bold')">B</button>
      <button class="bt-btn" style="font-style:italic" title="__T_NOTEBOOK_ITALIC__"
        @mousedown.prevent @click="exec('italic')">I</button>
      <span class="bt-sep"></span>
      <button class="bt-btn" title="__T_NOTEBOOK_INSERT_IMAGE__"
        @mousedown.prevent @click="onImage">🖼</button>
      <input type="file" accept="image/*" class="nb-file-input hidden" @change="onFile" />
    </div>
  </div>
</template>

<style scoped>
.bt-inner {
  display: flex; align-items: center; gap: 2px;
  padding: 4px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-card) 95%, transparent);
  border: 1px solid var(--color-line);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.bt-btn {
  display: flex; align-items: center; justify-content: center;
  height: 32px; min-width: 32px; padding: 0 8px;
  border: 0; border-radius: 999px;
  background: transparent;
  font-size: 13px; font-weight: 500;
  color: var(--color-muted); cursor: pointer;
  transition: background .08s, color .08s;
}
.bt-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.bt-sep { width: 1px; height: 20px; background: var(--color-line); margin: 0 4px; }
</style>
