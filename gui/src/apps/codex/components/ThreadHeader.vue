<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  title: { type: String, default: "新会话" },
  modes: { type: Array, default: () => [] },
  mode: { type: String, default: "workspace" },
  cwd: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:mode", "update:cwd"]);

const editingCwd = ref(false);
const cwdDraft = ref("");
const modeOpen = ref(false);

const activeMode = computed(() => props.modes.find((item) => item.id === props.mode) || props.modes[0] || {});
const cwdDisplay = computed(() => {
  if (!props.cwd) return "未设置";
  const parts = props.cwd.split("/").filter(Boolean);
  if (parts.length <= 2) return props.cwd;
  return "…/" + parts.slice(-2).join("/");
});

function openCwd() {
  if (props.disabled) return;
  cwdDraft.value = props.cwd;
  editingCwd.value = true;
}

function commitCwd() {
  emit("update:cwd", cwdDraft.value.trim());
  editingCwd.value = false;
}

function pickMode(item) {
  emit("update:mode", item.id);
  modeOpen.value = false;
}
</script>

<template>
  <header class="thread-header">
    <div class="title">{{ title }}</div>
    <div class="chips">
      <div class="chip-wrap">
        <button
          class="chip"
          :disabled="disabled"
          :title="cwd || '点击设置工作区'"
          @click="openCwd">
          <span class="msi">folder</span>
          <span class="chip-text">{{ cwdDisplay }}</span>
        </button>
        <div v-if="editingCwd" class="popover cwd-pop" @click.stop>
          <label>工作区路径</label>
          <input
            v-model="cwdDraft"
            placeholder="/path/to/project"
            autofocus
            @keydown.enter="commitCwd"
            @keydown.esc="editingCwd = false" />
          <div class="pop-actions">
            <button class="ghost" @click="editingCwd = false">取消</button>
            <button class="primary" @click="commitCwd">确定</button>
          </div>
        </div>
      </div>

      <div class="chip-wrap">
        <button
          class="chip"
          :class="{ open: modeOpen }"
          :disabled="disabled"
          @click="modeOpen = !modeOpen">
          <span class="msi">{{ activeMode.icon || 'tune' }}</span>
          <span class="chip-text">{{ activeMode.name || '模式' }}</span>
          <span class="msi caret">expand_more</span>
        </button>
        <div v-if="modeOpen" class="popover mode-pop" @click.stop>
          <button
            v-for="item in modes"
            :key="item.id"
            class="mode-item"
            :class="{ active: item.id === mode }"
            @click="pickMode(item)">
            <span class="msi">{{ item.icon }}</span>
            <span class="mode-body">
              <strong>{{ item.name }}</strong>
              <span>{{ item.desc }}</span>
            </span>
            <span v-if="item.id === mode" class="msi check">check</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="editingCwd || modeOpen" class="pop-mask" @click="editingCwd = false; modeOpen = false" />
  </header>
</template>

<style scoped>
.thread-header {
  flex: none;
  position: relative;
  display: flex; align-items: center; gap: 14px;
  padding: 12px 18px;
  background: var(--bg);
  border-bottom: 1px solid var(--line-soft);
  min-width: 0;
}
.title {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.chips {
  flex: none;
  display: flex; gap: 6px;
  align-items: center;
}
.chip-wrap { position: relative; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 11px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-2);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background .12s, color .12s, border-color .12s;
}
.chip:hover:not(:disabled), .chip.open {
  background: var(--bg-elev);
  color: var(--text);
  border-color: var(--line);
}
.chip:disabled { opacity: 0.55; cursor: default; }
.chip .msi { font-size: 15px; }
.chip .caret { font-size: 16px; margin-right: -3px; }
.chip-text {
  font-family: var(--font-mono);
  font-size: 11.5px;
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 30;
  background: var(--bg);
  border-radius: 12px;
  box-shadow: var(--shadow-3);
  border: 1px solid var(--line-soft);
  padding: 8px;
  min-width: 260px;
}
.cwd-pop { display: grid; gap: 8px; }
.cwd-pop label {
  font-size: 11px;
  color: var(--text-3);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0 4px;
}
.cwd-pop input {
  width: 100%;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0 11px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 12.5px;
  outline: 0;
}
.cwd-pop input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.14);
}
.pop-actions { display: flex; gap: 6px; justify-content: flex-end; padding-top: 2px; }
.pop-actions button {
  border: 0; border-radius: 8px;
  height: 30px; padding: 0 12px;
  font: inherit; font-size: 12px; font-weight: 600;
  cursor: pointer;
}
.pop-actions .ghost { background: var(--bg-elev); color: var(--text-2); }
.pop-actions .ghost:hover { background: var(--bg-hover); color: var(--text); }
.pop-actions .primary { background: var(--accent); color: #fff; }
.pop-actions .primary:hover { background: var(--accent-hi); }

.mode-pop { display: grid; gap: 1px; min-width: 240px; }
.mode-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  border: 0; border-radius: 8px;
  background: transparent;
  padding: 8px 10px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: var(--text);
  transition: background .12s;
}
.mode-item:hover { background: var(--bg-elev); }
.mode-item.active { background: var(--accent-soft); color: var(--accent-fg); }
.mode-item .msi:first-child {
  font-size: 18px;
  color: var(--text-2);
}
.mode-item.active .msi:first-child { color: var(--accent); }
.mode-body { flex: 1; display: grid; gap: 1px; min-width: 0; }
.mode-body strong { font-size: 13px; font-weight: 600; }
.mode-body span { font-size: 11px; color: var(--text-3); }
.mode-item.active .mode-body span { color: var(--accent-fg); opacity: 0.7; }
.check { font-size: 18px; color: var(--accent); }

.pop-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
}

@media (max-width: 760px) {
  .thread-header { padding: 10px 12px; gap: 8px; }
  .chip-text { max-width: 100px; }
  .popover { min-width: min(280px, 90vw); }
}
</style>
