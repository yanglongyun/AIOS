<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#f6f3ee] text-[#241f1a]">
    <div class="border-b border-black/[0.06] bg-white/80 px-5 py-4 backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-[22px] font-semibold">__T_TASKS_CENTER__</div>
          <div class="mt-1 text-[13px] text-black/55">{{ summaryLabel }}</div>
        </div>
        <button class="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] font-medium text-[#222] transition hover:bg-black/[0.03]" @click="loadTasks">
          __T_TASKS_REFRESH__
        </button>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
          <div class="text-[12px] text-black/45">__T_TASKS_STATUS_PENDING__</div>
          <div class="mt-1 text-[22px] font-semibold">{{ pendingCount }}</div>
        </div>
        <div class="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
          <div class="text-[12px] text-black/45">__T_TASKS_STATUS_DONE__</div>
          <div class="mt-1 text-[22px] font-semibold">{{ doneCount }}</div>
        </div>
        <div class="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
          <div class="text-[12px] text-black/45">__T_TASKS_STATUS_ERROR__</div>
          <div class="mt-1 text-[22px] font-semibold">{{ errorCount }}</div>
        </div>
        <div class="rounded-xl border border-black/[0.06] bg-white px-4 py-3">
          <div class="text-[12px] text-black/45">__T_TASKS_STATUS_ABORTED__</div>
          <div class="mt-1 text-[22px] font-semibold">{{ abortedCount }}</div>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div v-if="error" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{{ error }}</div>

      <div v-if="tasks.length === 0" class="rounded-2xl border border-dashed border-black/[0.1] bg-white/70 px-6 py-14 text-center text-[14px] text-black/45">
        __T_TASKS_EMPTY__
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div class="grid grid-cols-[minmax(0,1.5fr)_120px_120px_160px_84px] gap-4 border-b border-black/[0.06] px-5 py-3 text-[12px] font-semibold text-black/45">
          <div>__T_TASKS_COLUMN_TITLE__</div>
          <div>__T_TASKS_COLUMN_MODE__</div>
          <div>__T_TASKS_COLUMN_STATUS__</div>
          <div>__T_TASKS_COLUMN_TIME__</div>
          <div></div>
        </div>

        <button
          v-for="task in tasks"
          :key="task.id"
          class="grid w-full grid-cols-[minmax(0,1.5fr)_120px_120px_160px_84px] gap-4 border-b border-black/[0.05] px-5 py-4 text-left transition last:border-b-0 hover:bg-black/[0.02]"
          @click="openTask(task.id)"
        >
          <div class="min-w-0">
            <div class="truncate text-[14px] font-medium text-[#222]">{{ task.title || '__T_TASKS_UNNAMED__' }}</div>
            <div class="mt-1 truncate text-[12px] text-black/45">{{ task.response || task.prompt || '-' }}</div>
          </div>
          <div class="text-[13px] text-black/70">{{ taskModeLabel(task.mode) }}</div>
          <div>
            <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusClass(task.status)">
              {{ taskStatusLabel(task.status) }}
            </span>
          </div>
          <div class="text-[13px] text-black/55">{{ formatCompactDateTime(task.finished_at || task.created_at) }}</div>
          <div class="text-right text-[13px] font-medium text-[#222]">__T_TASKS_OPEN__</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../system/ws.js';
import { windowManager } from '../../system/windows.js';
import { taskDetailWindow } from './intent.js';
import { formatCompactDateTime } from './timeline.js';

const tasks = ref([]);
const error = ref('');

const pendingCount = computed(() => tasks.value.filter((task) => task.status === 'pending').length);
const doneCount = computed(() => tasks.value.filter((task) => task.status === 'done').length);
const errorCount = computed(() => tasks.value.filter((task) => task.status === 'error').length);
const abortedCount = computed(() => tasks.value.filter((task) => task.status === 'aborted').length);
const summaryLabel = computed(() => '__T_TASKS_SUMMARY__'.replace('{tasks}', String(tasks.value.length)));

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
};

const loadTasks = async () => {
  error.value = '';
  try {
    const data = await request('/api/task?limit=200');
    tasks.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || '__T_TASKS_LOAD_FAIL__';
  }
};

const openTask = (id) => {
  if (id) windowManager.openWindow(taskDetailWindow, { id });
};

const taskModeLabel = (mode) => {
  if (mode === 'instant') return '__T_TASKS_MODE_LABEL_INSTANT__';
  if (mode === 'agent') return '__T_TASKS_MODE_LABEL_AGENT__';
  return mode || '-';
};

const taskStatusLabel = (status) => ({
  pending: '__T_TASKS_STATUS_PENDING__',
  done: '__T_TASKS_STATUS_DONE__',
  error: '__T_TASKS_STATUS_ERROR__',
  aborted: '__T_TASKS_STATUS_ABORTED__'
}[status] || status || '-');

const statusClass = (status) => ({
  'bg-blue-50 text-blue-700': status === 'pending',
  'bg-emerald-50 text-emerald-700': status === 'done',
  'bg-red-50 text-red-700': status === 'error',
  'bg-zinc-100 text-zinc-700': status === 'aborted'
});

const unsubs = [];
onMounted(async () => {
  await loadTasks();
  unsubs.push(on('tasks_changed', loadTasks));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
