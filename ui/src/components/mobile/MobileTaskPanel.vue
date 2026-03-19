<template>
  <div class="px-4 py-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-[16px] font-bold text-[#3a2a18]">{{ t('tasks_title') }}</h2>
      <button class="text-[13px] text-[#c8a060]" @click="fetchTasks">{{ t('tasks_refresh') }}</button>
    </div>

    <div v-if="loading" class="py-10 text-center text-[13px] text-[#9a8870]">...</div>
    <div v-else-if="!tasks.length" class="py-10 text-center text-[13px] text-[#9a8870]">{{ t('tasks_empty') }}</div>
    <div v-else class="flex flex-col gap-2.5">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="rounded-[14px] border border-[#e0d0b8] bg-white px-4 py-3 shadow-sm"
      >
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="flex-1 truncate text-[13px] font-semibold text-[#3a2a18]">{{ task.name || t('tasks_unnamed') }}</span>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="task.status === 'running' ? 'bg-[#dff0e8] text-[#2d6a30]' : task.status === 'completed' ? 'bg-[#e8e8e8] text-[#6a6a6a]' : 'bg-[#fef3e8] text-[#a06030]'"
          >{{ task.status }}</span>
        </div>
        <p v-if="task.prompt" class="line-clamp-2 text-[12px] text-[#8a7a60]">{{ task.prompt }}</p>
        <p v-if="task.run_at || task.cron" class="mt-1 text-[11px] text-[#b0a090]">{{ task.run_at || task.cron }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
const props = defineProps({ taskCount: { type: Number, default: 0 } });

const tasks = ref([]);
const loading = ref(true);

async function fetchTasks() {
  loading.value = true;
  try {
    const res = await fetch('/aios/api/tasks/list');
    const data = await res.json();
    tasks.value = Array.isArray(data) ? data : (data.tasks || []);
  } catch {
    tasks.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchTasks);
</script>
