<script setup>
import AppHub from "@/components/AppHub.vue";
import AskAI from "@/components/AskAI.vue";

defineProps({
  title: { type: String, required: true },
  connected: { type: Boolean, default: false },
  drawerOpen: { type: Boolean, default: false },
});

defineEmits(["toggle-drawer"]);
</script>

<template>
  <header class="flex h-16 flex-none items-center px-4 bg-bg max-md:h-14 max-md:px-2">
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
      <span :class="{ ok: connected }">{{ connected ? "已连接" : "未连接" }}</span>
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
  font-size: 20px;
  font-weight: 650;
}
.top-title span:last-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-title .msi { color: #276ef1; }
.top-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #7a8490;
  font-size: 12px;
}
.top-status > span:first-child {
  border-radius: 999px;
  background: #eef3f7;
  padding: 5px 9px;
}
.top-status > span.ok {
  background: #e8f5ee;
  color: #1f6b3e;
}
@media (max-width: 760px) {
  .top-title { font-size: 17px; }
  .top-status > span:first-child { display: none; }
}
</style>
