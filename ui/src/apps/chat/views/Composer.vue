<script setup>
import { nextTick, ref } from 'vue';
import { uploadChatFile } from './api.js';

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
  el.style.height = el.scrollHeight + 'px';
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
  <div class="shrink-0 border-t border-[rgba(160,130,70,0.25)] bg-[linear-gradient(180deg,#e8dfca_0%,#dfd6bc_100%)] px-3.5 pb-3 pt-2.5 shadow-[0_-3px_10px_rgba(90,60,20,0.08)]">
    <input ref="fileInput" type="file" class="hidden" multiple @change="onPickFiles" />

    <div v-if="pendingFiles.length" class="mb-2 flex gap-2 overflow-x-auto pt-2 pb-1 pr-1 [scrollbar-width:none]">
      <div
        v-for="(f, idx) in pendingFiles"
        :key="f.path"
        class="relative flex h-[54px] w-[168px] shrink-0 items-center gap-2.5 rounded-[13px] border border-[rgba(125,95,45,0.20)] bg-[linear-gradient(160deg,#f7f0df_0%,#ded1b4_100%)] px-2.5 shadow-[0_3px_9px_rgba(92,62,22,0.16),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(110,80,30,0.08)]"
      >
        <div class="file-icon relative grid h-[34px] w-[28px] shrink-0 place-items-center rounded-[4px] border border-[rgba(130,96,45,0.22)] bg-[linear-gradient(180deg,#fff8e8_0%,#e7d4a9_100%)] shadow-[0_1px_3px_rgba(90,60,20,0.18),inset_0_1px_0_rgba(255,255,255,0.95)]">
          <span class="mt-1 h-[2px] w-3 rounded-full bg-[#b88a34]"></span>
          <span class="absolute bottom-[9px] h-[2px] w-3.5 rounded-full bg-[rgba(120,90,40,0.28)]"></span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[12px] font-bold leading-tight text-[#4a321d]">{{ f.name }}</div>
          <div class="mt-0.5 truncate font-mono text-[9.5px] text-[#9a7850]">{{ formatSize(f.size) || f.type || 'file' }}</div>
        </div>
        <button
          type="button"
          class="absolute -right-[6px] -top-[6px] grid h-[20px] w-[20px] place-items-center rounded-full border border-[rgba(255,220,160,0.35)] bg-[linear-gradient(180deg,#9a3a18_0%,#68220d_100%)] text-[12px] font-bold leading-none text-[#fff3dc] shadow-[0_2px_5px_rgba(70,30,0,0.30),inset_0_1px_0_rgba(255,190,120,0.32)]"
          @click="pendingFiles.splice(idx,1)"
        >×</button>
      </div>
    </div>
    <div v-if="uploadError" class="mb-1 text-[11px] text-[#c04040]">{{ uploadError }}</div>

    <div class="flex items-end gap-2 rounded-2xl border border-[rgba(120,90,40,0.2)] bg-[linear-gradient(180deg,#d8d0b8_0%,#e0d8c0_100%)] py-1.5 pl-2.5 pr-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.12),inset_0_1px_3px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.5)]">
      <button
        type="button"
        :disabled="busy || uploading"
        @click="openFilePicker"
        class="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[8px] text-[18px] text-[#8b6840] active:bg-[rgba(0,0,0,0.08)] disabled:opacity-40"
      >{{ uploading ? '⏳' : '📎' }}</button>
      <textarea
        ref="textarea"
        :value="modelValue"
        @input="setInput($event.target.value); autoResize()"
        @keydown.enter.exact="onEnter"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        :placeholder="busy ? '进行中...' : '输入消息...'"
        rows="1"
        :disabled="busy"
        class="max-h-24 min-h-8 flex-1 resize-none border-none bg-transparent py-[6px] font-[inherit] text-[14px] leading-[1.5] text-[#3a2415] outline-none placeholder:text-[#b09870] disabled:opacity-50"
      />
      <button
        v-if="busy"
        type="button"
        @click="emit('abort')"
        class="mb-1 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(180deg,#d4981e_0%,#a07010_100%)] text-[14px] font-bold text-[rgba(255,245,200,0.95)] shadow-[0_3px_0_rgba(106,72,0,1),0_4px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,215,80,0.35)]"
      >■</button>
      <button
        v-else
        type="button"
        :disabled="!modelValue.trim() && !pendingFiles.length"
        @click="emit('send')"
        class="mb-1 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] transition-all"
        :class="(modelValue.trim() || pendingFiles.length)
          ? 'bg-[linear-gradient(180deg,#d4981e_0%,#a07010_100%)] text-[rgba(255,245,200,0.95)] shadow-[0_3px_0_rgba(106,72,0,1),0_4px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,215,80,0.35)]'
          : 'bg-[rgba(120,90,40,0.1)] text-[rgba(120,90,40,0.3)]'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2 21L23 12 2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.file-icon::after {
  content: '';
  position: absolute;
  right: -1px;
  top: -1px;
  width: 10px;
  height: 10px;
  border-left: 1px solid rgba(130,96,45,0.20);
  border-bottom: 1px solid rgba(130,96,45,0.20);
  border-bottom-left-radius: 3px;
  background: linear-gradient(135deg,#d7bd78 0%,#fff4d8 100%);
  clip-path: polygon(0 0, 100% 100%, 100% 0);
}
</style>
