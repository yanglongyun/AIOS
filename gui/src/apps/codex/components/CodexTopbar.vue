<script setup>
import AppHub from "@/components/AppHub.vue";
import AskAI from "@/components/AskAI.vue";

defineProps({
  title: { type: String, required: true },
  connected: { type: Boolean, default: false },
  starting: { type: Boolean, default: false },
  drawerOpen: { type: Boolean, default: false },
});

defineEmits(["toggle-drawer", "start"]);
</script>

<template>
  <header class="flex h-16 flex-none items-center px-4 bg-bg border-b border-line-soft max-md:h-14 max-md:px-2">
    <button
      class="icon-btn lg"
      :class="{ active: drawerOpen }"
      title="侧栏"
      @click="$emit('toggle-drawer')">
      <span class="msi">menu</span>
    </button>

    <div class="top-title">
      <span class="msi">terminal</span>
      <span>{{ title }}</span>
    </div>

    <div class="ml-auto top-status">
      <button
        class="status-pill"
        :class="{ ok: connected, starting }"
        :disabled="starting"
        :title="connected ? '已连接' : '点击启动 Codex'"
        @click="!connected && !starting && $emit('start')">
        <i class="dot" />
        <span>{{ starting ? "启动中" : connected ? "已连接" : "启动 Codex" }}</span>
      </button>
      <AskAI />
      <AppHub />
    </div>
  </header>
</template>

<style scoped>
.top-title {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  font-size: 19px;
  font-weight: 650;
  color: var(--text);
}
.top-title span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-title .msi {
  color: var(--accent);
  font-size: 22px;
}
.top-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 999px;
  background: var(--bg-elev);
  color: var(--text-2);
  padding: 6px 12px 6px 10px;
  font: inherit;
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background .15s, color .15s, box-shadow .15s;
}
.status-pill:hover:not(:disabled):not(.ok) {
  background: var(--accent-soft);
  color: var(--accent-fg);
  box-shadow: inset 0 0 0 1px rgba(26, 115, 232, 0.2);
}
.status-pill .dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--text-3);
}
.status-pill.ok {
  background: rgba(30, 142, 62, 0.1);
  color: var(--good);
  cursor: default;
}
.status-pill.ok .dot {
  background: var(--good);
  box-shadow: 0 0 0 3px rgba(30, 142, 62, 0.18);
}
.status-pill.starting {
  background: var(--accent-soft);
  color: var(--accent-fg);
}
.status-pill.starting .dot {
  background: var(--accent);
  animation: pulse 1.2s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.3; } }
@media (max-width: 760px) {
  .top-title { font-size: 16px; }
  .status-pill span { display: none; }
  .status-pill { padding: 7px; }
}
</style>
