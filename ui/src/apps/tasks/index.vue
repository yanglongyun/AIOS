<template>
  <div class="flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#f7f4ed_0%,#ece6d9_48%,#ddd4c3_100%)] text-[#241f1a]">
    <div class="border-b border-[#bcae97] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(235,228,214,0.95))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_10px_28px_rgba(88,67,36,0.08)] backdrop-blur">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#76684f]">Task Monitor</div>
          <div class="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#2a2218]">__T_TASKS_CENTER__</div>
          <div class="mt-1 text-[13px] text-[#6d604a]">{{ summaryLabel }}</div>
        </div>
        <button
          class="rounded-xl border border-[#b6a791] bg-[linear-gradient(180deg,#fffdfa,#ebe1cf)] px-3.5 py-2 text-[13px] font-medium text-[#352d21] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_2px_6px_rgba(71,55,28,0.08)] transition hover:bg-[linear-gradient(180deg,#ffffff,#e6dbc6)]"
          @click="loadTasks"
        >
          __T_TASKS_REFRESH__
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5">
      <div class="mx-auto flex max-w-[1140px] flex-col gap-5">
        <div v-if="error" class="rounded-2xl border border-red-300 bg-[linear-gradient(180deg,#fff7f7,#fde6e6)] px-4 py-3 text-[13px] text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          {{ error }}
        </div>

        <section class="grid gap-3 md:grid-cols-4">
          <div class="rounded-[22px] border border-[#bfb098] bg-[linear-gradient(180deg,#fcfaf5,#efe6d7)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_20px_rgba(78,60,31,0.06)]">
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7c6c54]">Total</div>
            <div class="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#20180f]">{{ tasks.length }}</div>
            <div class="mt-1 text-[12px] text-[#7c6c54]">{{ summaryLabel }}</div>
          </div>
          <div
            v-for="card in statusCards"
            :key="card.key"
            class="rounded-[22px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_8px_20px_rgba(78,60,31,0.05)]"
            :class="card.panelClass"
          >
            <div class="text-[11px] font-semibold uppercase tracking-[0.22em]" :class="card.kickerClass">{{ card.label }}</div>
            <div class="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-[#20180f]">{{ card.value }}</div>
            <div class="mt-2 h-[6px] overflow-hidden rounded-full bg-black/8">
              <div class="h-full rounded-full" :class="card.barClass" :style="{ width: `${card.percent}%` }" />
            </div>
          </div>
        </section>

        <div v-if="tasks.length === 0" class="rounded-[28px] border border-dashed border-[#b8aa95] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(240,233,220,0.78))] px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div class="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#86765e]">Queue</div>
          <div class="mt-3 text-[15px] text-[#6f614d]">__T_TASKS_EMPTY__</div>
        </div>

        <section v-else class="overflow-hidden rounded-[30px] border border-[#b8a88f] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,232,217,0.95))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_36px_rgba(77,58,30,0.08)]">
          <div class="border-b border-[#c8b9a2] bg-[linear-gradient(180deg,#f7f2e7,#e7dcc9)] px-5 py-3">
            <div class="grid grid-cols-[minmax(0,1.7fr)_120px_130px_160px] gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#77684f]">
              <div>__T_TASKS_COLUMN_TITLE__</div>
              <div>__T_TASKS_COLUMN_MODE__</div>
              <div>__T_TASKS_COLUMN_STATUS__</div>
              <div>__T_TASKS_COLUMN_TIME__</div>
            </div>
          </div>

          <div class="max-h-full overflow-y-auto">
            <button
              v-for="task in tasks"
              :key="task.id"
              class="group grid w-full grid-cols-[minmax(0,1.7fr)_120px_130px_160px] gap-4 border-b border-[#ded2bf] px-5 py-4 text-left transition last:border-b-0 odd:bg-white/[0.42] even:bg-[#f4ecdd]/70 hover:bg-[#efe6d6]"
              @click="openTask(task.id)"
            >
              <div class="flex min-w-0 items-start gap-3">
                <span class="mt-[6px] h-2.5 w-2.5 flex-none rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.55)]" :class="statusDotClass(task.status)" />
                <div class="min-w-0">
                  <div class="truncate text-[14px] font-semibold text-[#261e14]">{{ task.title || '__T_TASKS_UNNAMED__' }}</div>
                  <div class="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#7f715a]">
                    <span>#{{ task.id }}</span>
                    <span v-if="task.app">{{ task.app }}</span>
                  </div>
                  <div class="mt-2 truncate text-[12px] leading-5 text-[#615645]">{{ task.response || task.prompt || '-' }}</div>
                </div>
              </div>
              <div class="flex items-center text-[13px] font-medium text-[#534835]">{{ taskModeLabel(task.mode) }}</div>
              <div class="flex items-center">
                <span
                  class="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                  :class="statusClass(task.status)"
                >
                  {{ taskStatusLabel(task.status) }}
                </span>
              </div>
              <div class="flex items-center text-[13px] text-[#675b47]">{{ formatCompactDateTime(task.finished_at || task.created_at) }}</div>
            </button>
          </div>
        </section>
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

const summaryLabel = computed(() => '__T_TASKS_SUMMARY__'.replace('{tasks}', String(tasks.value.length)));
const totalTasks = computed(() => tasks.value.length || 0);
const countByStatus = (status) => tasks.value.filter((task) => task.status === status).length;
const statusCards = computed(() => {
  const total = totalTasks.value || 1;
  return [
    {
      key: 'pending',
      label: taskStatusLabel('pending'),
      value: countByStatus('pending'),
      percent: Math.max(8, Math.round((countByStatus('pending') / total) * 100)),
      panelClass: 'border-[#b8c6d8] bg-[linear-gradient(180deg,#f6fbff,#e3edf8)]',
      kickerClass: 'text-[#5d738d]',
      barClass: 'bg-[#78a9d2]'
    },
    {
      key: 'done',
      label: taskStatusLabel('done'),
      value: countByStatus('done'),
      percent: Math.max(8, Math.round((countByStatus('done') / total) * 100)),
      panelClass: 'border-[#b9c9bb] bg-[linear-gradient(180deg,#f7fbf6,#e2ebdf)]',
      kickerClass: 'text-[#5e755b]',
      barClass: 'bg-[#87a774]'
    },
    {
      key: 'error',
      label: taskStatusLabel('error'),
      value: countByStatus('error') + countByStatus('aborted'),
      percent: Math.max(8, Math.round(((countByStatus('error') + countByStatus('aborted')) / total) * 100)),
      panelClass: 'border-[#d4b9b3] bg-[linear-gradient(180deg,#fff9f8,#f1ddd7)]',
      kickerClass: 'text-[#8c605c]',
      barClass: 'bg-[#c68779]'
    }
  ];
});

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
  'border-[#b9c8d7] bg-[#eef5fb] text-[#58718b]': status === 'pending',
  'border-[#b9cab9] bg-[#edf4eb] text-[#556f54]': status === 'done',
  'border-[#d5b7b0] bg-[#fbefec] text-[#8c605c]': status === 'error',
  'border-[#c8c0b5] bg-[#f0ede8] text-[#6d6559]': status === 'aborted'
});

const statusDotClass = (status) => ({
  'bg-[#78a9d2]': status === 'pending',
  'bg-[#86a86f]': status === 'done',
  'bg-[#c68779]': status === 'error',
  'bg-[#9d9486]': status === 'aborted'
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
