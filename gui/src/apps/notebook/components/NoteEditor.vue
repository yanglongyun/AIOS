<script setup>
import { ref } from 'vue';
import ContentEditor from './ContentEditor.vue';
import EditorToolbar from './EditorToolbar.vue';

const props = defineProps({
  note: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  polishing: { type: Boolean, default: false },
  polishResult: { type: String, default: '' },
});
const emit = defineEmits(['back', 'save', 'remove', 'polish', 'apply-polish', 'dismiss-polish']);

const editorRef = ref(null);

const accessOptions = [
  { key: 'none', label: '__T_NOTEBOOK_ACCESS_NONE__', desc: '__T_NOTEBOOK_ACCESS_NONE_DESC__' },
  { key: 'summary', label: '__T_NOTEBOOK_ACCESS_SUMMARY__', desc: '__T_NOTEBOOK_ACCESS_SUMMARY_DESC__' },
  { key: 'full', label: '__T_NOTEBOOK_ACCESS_FULL__', desc: '__T_NOTEBOOK_ACCESS_FULL_DESC__' },
];

const coverInput = ref(null);

function onCoverFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  uploadCover(file);
}

async function uploadCover(file) {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/apps/notebook/upload', { method: 'POST', body: form, credentials: 'same-origin' });
    const data = await res.json();
    if (data.files?.[0]?.url) {
      emit('save', props.note.id, { cover: data.files[0].url });
    }
  } catch (e) {
    console.error('cover upload failed', e);
  }
}

function insertImageFromToolbar(file) {
  editorRef.value?.uploadAndInsert?.(file);
}

function onContentChange(html) {
  emit('save', props.note.id, { content: html, _local: true });
}

function onContentBlur() {
  emit('save', props.note.id, { content: props.note.content });
}

function setIcon(emoji) {
  emit('save', props.note.id, { icon: emoji || null });
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Cover -->
    <div v-if="note.cover" class="cover" :style="{ backgroundImage: `url(${note.cover})` }"
      @click="coverInput?.click()">
    </div>

    <div class="mx-auto w-full min-w-0 max-w-[820px] flex-1 overflow-auto px-12 pt-10 pb-32 max-md:px-5 max-md:pt-6">
      <!-- Back -->
      <button class="mb-2 rounded px-1.5 py-1 text-sm text-faint hover:bg-bg-hi hover:text-muted"
        @click="emit('back')">
        ← __T_COMMON_BACK__
      </button>

      <!-- Icon -->
      <div v-if="note.icon" class="mt-2">
        <button class="icon-btn" @click="setIcon(null)">{{ note.icon }}</button>
      </div>

      <!-- Meta actions -->
      <div class="mt-2 flex items-center gap-1 text-faint">
        <button v-if="!note.icon" class="meta-btn" @click="setIcon('📝')">😀 __T_NOTEBOOK_ADD_ICON__</button>
        <button v-if="!note.cover" class="meta-btn" @click="coverInput?.click()">🏞️ __T_NOTEBOOK_ADD_COVER__</button>
        <button class="meta-btn" @click="emit('remove', note)">__T_COMMON_DELETE__</button>
        <span v-if="saving" class="ml-2 text-xs text-faint">__T_COMMON_SAVING__</span>
      </div>
      <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverFile" />

      <!-- Title -->
      <input :value="note.title"
        @input="emit('save', note.id, { title: $event.target.value, _local: true })"
        @blur="(e) => emit('save', note.id, { title: e.target.value })"
        placeholder="__T_NOTEBOOK_TITLE_PLACEHOLDER__"
        class="mt-2 w-full border-0 bg-transparent py-1 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink outline-none placeholder:text-hint max-md:text-[24px]" />

      <!-- Access -->
      <div class="mt-3 flex items-center gap-2 pb-2">
        <span class="text-xs text-faint">__T_NOTEBOOK_AI_VISIBILITY__</span>
        <button v-for="opt in accessOptions" :key="opt.key"
          class="access-opt" :class="{ active: (note.access || 'none') === opt.key }"
          @click="emit('save', note.id, { access: opt.key })">
          {{ opt.label }}<span class="access-desc">{{ opt.desc }}</span>
        </button>
      </div>

      <!-- Summary -->
      <textarea
        :value="note.summary"
        @blur="(e) => emit('save', note.id, { summary: e.target.value })"
        placeholder="__T_NOTEBOOK_SUMMARY_PLACEHOLDER__"
        class="summary-area" />

      <!-- Content -->
      <ContentEditor ref="editorRef"
        class="mt-4"
        :value="note.content"
        @update:value="onContentChange"
        @blur="onContentBlur" />

      <!-- Polish -->
      <div v-if="polishResult" class="polish-section">
        <div class="polish-bar">
          <span class="text-xs font-medium text-accent">__T_NOTEBOOK_POLISH_RESULT__</span>
          <div class="flex-1"></div>
          <button class="polish-action-btn primary" @click="emit('apply-polish', note)">__T_COMMON_APPLY__</button>
          <button class="polish-action-btn" @click="emit('dismiss-polish')">__T_COMMON_CANCEL__</button>
        </div>
        <div class="polish-result" v-html="polishResult"></div>
      </div>

      <!-- Polish trigger -->
      <div class="mt-6 border-t border-line pt-4">
        <button class="meta-btn"
          :disabled="polishing || !note.content?.trim()"
          @click="emit('polish', note)">
          {{ polishing ? '__T_NOTEBOOK_POLISHING__' : '__T_NOTEBOOK_POLISH__' }}
        </button>
      </div>
    </div>

    <!-- Bottom toolbar -->
    <EditorToolbar :on-insert-image="insertImageFromToolbar" />
  </div>
</template>

<style scoped>
.cover {
  width: 100%; height: 30vh; min-height: 160px;
  background-size: cover; background-position: center;
  background-color: var(--color-bg-hi);
  cursor: pointer;
}

.icon-btn {
  display: flex; width: 78px; height: 78px;
  align-items: center; justify-content: center;
  font-size: 66px; line-height: 1;
  border: 0; background: transparent; border-radius: 6px;
  cursor: pointer;
}
.icon-btn:hover { background: var(--color-bg-hi); }

.meta-btn {
  border: 0; background: transparent;
  padding: 4px 6px; border-radius: 4px;
  font-size: 13px; color: var(--color-faint);
  cursor: pointer;
}
.meta-btn:hover { background: var(--color-bg-hi); color: var(--color-muted); }
.meta-btn:disabled { opacity: 0.4; cursor: default; }

.access-opt {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 8px; border-radius: 4px;
  border: 0; background: transparent;
  font-size: 12px; color: var(--color-faint);
  cursor: pointer; transition: background .1s;
}
.access-opt:hover { background: var(--color-bg-hi); }
.access-opt.active {
  background: var(--color-bg-hi);
  color: var(--color-ink);
  font-weight: 500;
}
.access-desc {
  font-size: 10px; color: var(--color-faint); margin-left: 2px;
}

.summary-area {
  width: 100%; min-height: 40px; border: 0;
  background: var(--color-bg-hi);
  border-radius: 4px; padding: 8px 10px; margin-top: 8px;
  font-size: 14px; line-height: 1.6;
  color: var(--color-muted); outline: none;
  resize: vertical;
}
.summary-area::placeholder { color: var(--color-hint); }

.polish-section {
  margin-top: 24px;
  border-top: 1px solid var(--color-line);
  padding-top: 12px;
}
.polish-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px;
}
.polish-action-btn {
  padding: 3px 10px; border-radius: 4px;
  border: 0; background: var(--color-bg-hi);
  font-size: 12px; color: var(--color-muted);
  cursor: pointer;
}
.polish-action-btn:hover { color: var(--color-ink); }
.polish-action-btn.primary {
  background: var(--color-accent);
  color: white;
}
.polish-result {
  font-size: 15px; line-height: 1.75;
  color: var(--color-muted);
  white-space: pre-wrap;
}
</style>
