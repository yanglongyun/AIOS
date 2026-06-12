<script setup>
import { nextTick, ref } from 'vue';
import { Paperclip, ArrowUp, Square } from 'lucide-vue-next';
import { uploadChatFile } from '../lib/api.js';

defineProps({
  modelValue: { type: String, default: '' },
  busy: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'send', 'abort']);
const textarea = ref(null);
const fileInput = ref(null);
const composing = ref(false);
const pendingFiles = ref([]);
const uploading = ref(false);
const uploadError = ref('');
const MAX_FILES = 10;

const setInput = (value) => emit('update:modelValue', value);

const autoResize = () => {
  const el = textarea.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
};

const resetTextarea = () => nextTick(() => {
  if (textarea.value) textarea.value.style.height = 'auto';
});

const onEnter = (e) => {
  if (composing.value || e.isComposing || e.keyCode === 229) return;
  e.preventDefault();
  emit('send');
};

const openFilePicker = () => {
  uploadError.value = '';
  fileInput.value?.click();
};

const pendingFileKey = (file) => `${file?.path || file?.name || ''}:${file?.size || 0}`;
const localFileKey = (file) => `${file?.name || ''}:${file?.size || 0}:${file?.lastModified || 0}`;

const appendFiles = async (files = []) => {
  if (!files.length) return;
  uploadError.value = '';
  if (pendingFiles.value.length >= MAX_FILES) {
    uploadError.value = '最多只能添加 10 个文件';
    return;
  }
  uploading.value = true;
  try {
    const seenLocal = new Set(pendingFiles.value.map(localFileKey));
    const seenUploaded = new Set(pendingFiles.value.map(pendingFileKey));
    for (const f of files) {
      if (pendingFiles.value.length >= MAX_FILES) {
        uploadError.value = '最多只能添加 10 个文件';
        break;
      }
      const localKey = localFileKey(f);
      if (seenLocal.has(localKey)) continue;
      seenLocal.add(localKey);
      const uploaded = await uploadChatFile(f);
      const uploadedKey = pendingFileKey(uploaded);
      if (uploaded?.path && !seenUploaded.has(uploadedKey)) {
        seenUploaded.add(uploadedKey);
        pendingFiles.value.push({ ...uploaded, lastModified: f.lastModified || 0 });
      }
    }
  } catch (err) {
    uploadError.value = err.message || '上传失败';
  } finally {
    uploading.value = false;
  }
};

const onPickFiles = async (e) => {
  await appendFiles(Array.from(e.target?.files || []));
  if (fileInput.value) fileInput.value.value = '';
};

const clearFiles = () => { pendingFiles.value = []; };

const formatSize = (size) => {
  const n = Number(size || 0);
  if (!n) return '';
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
};

defineExpose({ pendingFiles, clearFiles, resetTextarea, appendFiles });
</script>

<template>
  <div class="shrink-0 pb-3.5 pt-1">
    <div class="composer-col">
    <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />

    <div v-if="pendingFiles.length" class="mb-2 flex gap-2 overflow-x-auto pt-2 pb-1 pr-1 [scrollbar-width:none]">
      <div
        v-for="(f, idx) in pendingFiles"
        :key="f.path"
        class="relative flex h-[54px] w-[168px] shrink-0 items-center gap-2.5 rounded-xl border border-line bg-bg-elev px-2.5 shadow-[var(--shadow-sm)]"
      >
        <div class="relative grid h-[34px] w-[28px] shrink-0 place-items-center rounded-[4px] border border-line bg-bg-hi">
          <span class="mt-1 h-[2px] w-3 rounded-full bg-[var(--color-faint)]"></span>
          <span class="absolute bottom-[9px] h-[2px] w-3.5 rounded-full bg-[var(--color-line-hi)]"></span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[12px] font-semibold leading-tight text-ink">{{ f.name }}</div>
        <div class="mt-0.5 truncate font-mono text-[9.5px] text-muted">{{ formatSize(f.size) || f.type || 'file' }}</div>
        </div>
        <button
          type="button"
          class="absolute -right-[6px] -top-[6px] grid h-[20px] w-[20px] place-items-center rounded-full border border-line bg-bg-elev text-[12px] font-bold leading-none text-muted shadow-[var(--shadow-sm)]"
          @click="pendingFiles.splice(idx,1)"
        >×</button>
      </div>
    </div>
    <div v-if="uploadError" class="mb-1 text-[11px] text-[var(--color-bad)]">{{ uploadError }}</div>

    <div class="soft-card halo-focus flex items-end gap-2.5 rounded-2xl py-2.5 pl-2.5 pr-2.5 transition-shadow">
      <button
        type="button"
        :disabled="busy || uploading"
        :title="'附件'"
        @click="openFilePicker"
        class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-transparent text-muted hover:bg-bg-hi disabled:opacity-40"
      >
        <span v-if="uploading" class="text-[15px]">⏳</span>
        <Paperclip v-else :size="16" :stroke-width="1.8" />
      </button>
      <textarea
        ref="textarea"
        :value="modelValue"
        @input="setInput($event.target.value); autoResize()"
        @keydown.enter.exact="onEnter"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        :placeholder="busy ? '进行中...' : '问点什么...'"
        rows="1"
        :disabled="busy"
        class="block max-h-[180px] min-h-[34px] flex-1 resize-none border-none bg-transparent py-[6px] font-[inherit] text-[15px] leading-[22px] text-ink outline-none placeholder:text-[var(--color-faint)] disabled:opacity-50"
      />
      <button
        v-if="busy"
        type="button"
        :title="'停止'"
        @click="emit('abort')"
        class="composer-send grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-white"
      >
        <Square :size="12" fill="currentColor" :stroke-width="0" />
      </button>
      <button
        v-else
        type="button"
        :title="'发送'"
        :disabled="!modelValue.trim() && !pendingFiles.length"
        @click="emit('send')"
        class="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full transition-colors"
        :class="(modelValue.trim() || pendingFiles.length) ? 'composer-send text-white' : 'bg-bg-hi text-faint'"
      >
        <ArrowUp :size="15" :stroke-width="2.2" />
      </button>
    </div>
    </div>
  </div>
</template>

<style scoped>
.composer-col {
  width: min(860px, 100%);
  margin: 0 auto;
  padding: 0 24px;
}
.composer-send {
  background: #62a5f4;
  transition: background 0.12s, transform 0.12s;
}
.composer-send:hover { background: #3b82f6; }
.composer-send:active { transform: scale(0.94); }
</style>

