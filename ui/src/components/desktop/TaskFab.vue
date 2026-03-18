<template>
  <button
    class="task-fab fixed right-5 top-5 z-[200] flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border-none text-[#5a4a38] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
    @click="togglePanel"
  >
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg>
    <span v-if="taskCount > 0" class="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e04040] px-1 text-[10px] font-semibold text-white" style="height: 18px">{{ taskCount > 99 ? '99+' : taskCount }}</span>
  </button>

  <TasksPanel
    v-if="showPanel"
    :tasks="tasks"
    @close="showPanel = false"
  />
</template>

<script setup>
import { ref } from 'vue';
import TasksPanel from '../TasksPanel.vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] },
  taskCount: { type: Number, default: 0 },
  markRead: { type: Function, default: () => {} }
});

const showPanel = ref(false);

function togglePanel() {
  showPanel.value = !showPanel.value;
  if (showPanel.value) props.markRead();
}
</script>

<style scoped>
.task-fab {
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
</style>
