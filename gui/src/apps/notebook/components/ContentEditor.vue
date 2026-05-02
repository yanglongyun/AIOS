<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  value: { type: String, default: '' },
  placeholder: { type: String, default: '__T_NOTEBOOK_CONTENT_PLACEHOLDER__' },
});
const emit = defineEmits(['update:value']);

const editorRef = ref(null);
let isComposing = false;
let lastEmitted = null;

const showPlaceholder = computed(() => {
  const v = props.value || '';
  const stripped = v.replace(/<br\s*\/?>/gi, '').replace(/<div>\s*<\/div>/gi, '').trim();
  return !stripped;
});

function syncFromProp() {
  const el = editorRef.value;
  if (!el) return;
  if (props.value === lastEmitted) return;
  if (el.innerHTML === (props.value || '')) return;
  el.innerHTML = props.value || '';
}

onMounted(syncFromProp);
watch(() => props.value, syncFromProp);

function emitChange() {
  const el = editorRef.value;
  if (!el) return;
  lastEmitted = el.innerHTML;
  emit('update:value', el.innerHTML);
}

function onInput() {
  if (isComposing) return;
  emitChange();
}

async function handleImageFile(file) {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/apps/notebook/upload', { method: 'POST', body: form, credentials: 'same-origin' });
    const data = await res.json();
    if (data.files?.[0]?.url) {
      insertImage(data.files[0].url);
      emitChange();
    }
  } catch (e) {
    console.error('upload failed', e);
  }
}

function insertImage(url) {
  editorRef.value?.focus();
  const html = `<img src="${url}" alt="" style="max-width:100%;border-radius:6px;margin:8px 0" /><div><br></div>`;
  document.execCommand('insertHTML', false, html);
}

function onPaste(e) {
  const cd = e.clipboardData;
  if (!cd) return;
  for (const item of (cd.items || [])) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      e.preventDefault();
      handleImageFile(item.getAsFile());
      return;
    }
  }
  e.preventDefault();
  const text = cd.getData('text/plain') || '';
  if (text) document.execCommand('insertText', false, text);
}

function onDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files) return;
  for (const f of files) {
    if (f.type.startsWith('image/')) { handleImageFile(f); return; }
  }
}

function onKeydown(e) {
  const ctrl = e.metaKey || e.ctrlKey;
  if (!ctrl || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'b') { e.preventDefault(); document.execCommand('bold'); emitChange(); }
  if (k === 'i') { e.preventDefault(); document.execCommand('italic'); emitChange(); }
}

defineExpose({
  exec: (cmd, arg) => { document.execCommand(cmd, false, arg || null); emitChange(); },
  uploadAndInsert: handleImageFile,
});
</script>

<template>
  <div class="relative">
    <div v-if="showPlaceholder"
      class="pointer-events-none absolute left-0 top-0 text-[15px] leading-7 text-hint">
      {{ placeholder }}
    </div>
    <div ref="editorRef"
      contenteditable="true"
      class="editor-content"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
      @drop.prevent="onDrop"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false; emitChange()" />
  </div>
</template>

<style scoped>
.editor-content {
  min-height: 50vh;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 15px;
  line-height: 1.75;
  color: var(--color-ink);
  outline: none;
}
.editor-content :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 8px 0;
}
.editor-content :deep(h1) { margin-top: 1.5em; margin-bottom: 0.5em; font-size: 1.875rem; font-weight: 700; line-height: 1.2; }
.editor-content :deep(h2) { margin-top: 1.25em; margin-bottom: 0.5em; font-size: 1.5rem; font-weight: 700; line-height: 1.2; }
.editor-content :deep(h3) { margin-top: 1em; margin-bottom: 0.25em; font-size: 1.25rem; font-weight: 600; }
.editor-content :deep(strong), .editor-content :deep(b) { font-weight: 700; }
.editor-content :deep(em), .editor-content :deep(i) { font-style: italic; }
</style>
