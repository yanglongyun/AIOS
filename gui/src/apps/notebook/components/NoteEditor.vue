<script setup>
import { computed } from 'vue';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });
const renderMd = (text) => marked.parse(text || '');

const props = defineProps({
  note: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  polishing: { type: Boolean, default: false },
  polishResult: { type: String, default: '' },
});
const emit = defineEmits(['back', 'save', 'pin', 'remove', 'polish', 'apply-polish', 'dismiss-polish']);

const charCount = computed(() => props.note?.content?.length || 0);
const accessOptions = [
  { key: 'none', label: '__T_NOTEBOOK_ACCESS_NONE__', icon: 'visibility_off' },
  { key: 'summary', label: '__T_NOTEBOOK_ACCESS_SUMMARY__', icon: 'star' },
  { key: 'full', label: '__T_NOTEBOOK_ACCESS_FULL__', icon: 'priority_high' },
];
</script>

<template>
  <div class="mx-auto flex h-full w-full min-w-0 max-w-[820px] flex-col">
    <!-- Toolbar -->
    <header class="editor-toolbar">
      <button class="tool-btn" @click="emit('back')" title="__T_COMMON_BACK__">
        <span class="msi sm">arrow_back</span>
      </button>
      <div class="toolbar-meta">
        <span>{{ charCount }} __T_NOTEBOOK_WORD_UNIT__</span>
        <span v-if="saving" class="saving-dot">__T_COMMON_SAVING__</span>
      </div>
      <div class="toolbar-spacer"></div>
      <button class="tool-btn polish-btn"
        :disabled="polishing || !note.content?.trim()"
        @click="emit('polish', note)">
        <span class="msi sm" :class="{ spin: polishing }">{{ polishing ? 'progress_activity' : 'auto_fix_high' }}</span>
        <span class="max-md:hidden">{{ polishing ? '__T_NOTEBOOK_POLISHING__' : '__T_NOTEBOOK_POLISH__' }}</span>
      </button>
      <div class="access-switch" role="group" aria-label="__T_NOTEBOOK_AI_VISIBILITY__">
        <button v-for="item in accessOptions" :key="item.key"
          class="access-btn"
          :class="{ active: (note.access || 'none') === item.key }"
          @click="emit('save', note.id, { access: item.key })"
          :title="item.label">
          <span class="msi sm" :class="{ filled: item.key === 'summary' && note.access === 'summary' }">{{ item.icon }}</span>
          <span class="max-md:hidden">{{ item.label }}</span>
        </button>
      </div>
      <button class="tool-btn" :class="{ active: note.pinned }"
        @click="emit('pin', note)" :title="note.pinned ? '__T_NOTEBOOK_UNPIN__' : '__T_NOTEBOOK_PIN__'">
        <span class="msi sm" :class="{ filled: note.pinned }">push_pin</span>
      </button>
      <button class="tool-btn" @click="emit('remove', note)" title="__T_COMMON_DELETE__">
        <span class="msi sm">delete</span>
      </button>
    </header>

    <!-- Paper -->
    <div class="paper-scroll">
      <div class="paper">
        <input :value="note.title"
          @blur="(e) => emit('save', note.id, { title: e.target.value })"
          class="paper-title"
          placeholder="__T_NOTEBOOK_TITLE_PLACEHOLDER__" />

        <div class="paper-rule"></div>

        <textarea
          :value="note.summary"
          @blur="(e) => emit('save', note.id, { summary: e.target.value })"
          placeholder="__T_NOTEBOOK_SUMMARY_PLACEHOLDER__"
          class="paper-summary" />

        <textarea
          :value="note.content"
          @input="$emit('save', note.id, { content: $event.target.value, _local: true })"
          @blur="(e) => emit('save', note.id, { content: e.target.value })"
          placeholder="__T_NOTEBOOK_CONTENT_PLACEHOLDER__"
          class="paper-body" />

        <!-- Polish result -->
        <section v-if="polishResult" class="polish-card">
          <div class="polish-header">
            <span class="msi sm" style="color:var(--color-accent)">auto_fix_high</span>
            <span>__T_NOTEBOOK_POLISH_RESULT__</span>
          </div>
          <div class="md polish-content" v-html="renderMd(polishResult)"></div>
          <div class="polish-actions">
            <button class="pill-btn primary" @click="emit('apply-polish', note)">
              <span class="msi sm">check</span> __T_COMMON_APPLY__
            </button>
            <button class="pill-btn" @click="emit('dismiss-polish')">
              __T_COMMON_CANCEL__
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-line);
  flex: none;
}
@media (max-width: 768px) {
  .editor-toolbar { padding: 10px 12px; }
}

.toolbar-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 11.5px;
  color: var(--color-faint);
  margin-left: 8px;
}
.saving-dot {
  color: var(--color-accent);
}
.saving-dot::before {
  content: '';
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--color-accent);
  margin-right: 4px;
  vertical-align: middle;
  animation: pulse 1.2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

.toolbar-spacer { flex: 1; }

.access-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 10px;
  background: var(--color-bg-hi);
}
.access-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 28px; padding: 0 8px;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--color-muted);
  font-size: 12px; font-weight: 500;
  cursor: pointer;
}
.access-btn.active {
  background: var(--color-bg-elev);
  color: var(--color-accent);
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.tool-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 32px; padding: 0 10px;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--color-muted);
  font-size: 12.5px; font-weight: 500;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.tool-btn:hover:not(:disabled) { background: var(--color-bg-hi); color: var(--color-ink); }
.tool-btn:disabled { opacity: .45; cursor: default; }
.tool-btn.active { color: var(--color-accent); }
.tool-btn.polish-btn {
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  color: var(--color-accent);
}
.tool-btn.polish-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

/* Paper area */
.paper-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px 24px 60px;
  background:
    radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--color-accent) 3%, var(--color-bg)) 0%, var(--color-bg) 70%);
}
@media (max-width: 768px) {
  .paper-scroll { padding: 12px 8px 40px; }
}

.paper {
  background: var(--color-card);
  border-radius: 4px;
  padding: 40px 48px 60px;
  box-shadow:
    0 1px 3px rgba(0,0,0,.06),
    0 6px 24px rgba(0,0,0,.05),
    inset 0 1px 0 rgba(255,255,255,.6);
  border: 1px solid color-mix(in srgb, var(--color-line) 50%, transparent);
  min-height: calc(100vh - 200px);

  /* Lined paper */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 31px,
    color-mix(in srgb, var(--color-line) 40%, transparent) 31px,
    color-mix(in srgb, var(--color-line) 40%, transparent) 32px
  );
  background-position: 0 0;
}
@media (max-width: 768px) {
  .paper { padding: 24px 20px 40px; }
}

.paper-title {
  width: 100%;
  border: 0;
  background: transparent;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-ink);
  outline: none;
  padding: 0;
  margin: 0;
}
.paper-title::placeholder { color: var(--color-faint); }

.paper-rule {
  height: 2px;
  margin: 16px 0 20px;
  background: linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 20%, transparent));
  border-radius: 1px;
  opacity: .5;
}

.paper-summary {
  width: 100%;
  min-height: 64px;
  border: 0;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-accent) 5%, transparent);
  color: var(--color-muted);
  outline: none;
  resize: vertical;
  padding: 10px 12px;
  margin: 0 0 22px;
  font-size: 13px;
  line-height: 1.6;
}
.paper-summary::placeholder { color: var(--color-faint); }

.paper-body {
  width: 100%;
  min-height: 400px;
  border: 0;
  background: transparent;
  font-size: 15px;
  line-height: 32px;
  color: var(--color-ink);
  outline: none;
  padding: 0;
  margin: 0;
  resize: none;
}
.paper-body::placeholder { color: var(--color-faint); }

/* Polish */
.polish-card {
  margin-top: 32px;
  padding: 20px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-accent) 5%, var(--color-card));
  border: 1.5px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
}
.polish-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-accent);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.polish-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-ink);
}
.polish-actions {
  display: flex; gap: 8px;
  margin-top: 16px;
}

.pill-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 32px; padding: 0 14px;
  border: 1px solid var(--color-line);
  border-radius: 999px;
  background: var(--color-card);
  color: var(--color-muted);
  font-size: 12.5px; font-weight: 500;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.pill-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.pill-btn.primary {
  background: var(--color-accent);
  color: white;
  border-color: transparent;
}
.pill-btn.primary:hover { opacity: .9; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
