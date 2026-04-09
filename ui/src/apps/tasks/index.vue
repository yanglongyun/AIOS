<template>
  <div class="h-full overflow-y-auto bg-white p-6">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#222]">__T_TASKS_CENTER__</h1>
        <button type="button" class="cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-[#555] transition hover:bg-black/[0.04]" @click="loadAll">__T_TASKS_REFRESH__</button>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{{ error }}</div>

      <div class="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div v-if="allItems.length === 0" class="rounded-lg border border-dashed border-black/10 py-8 text-center text-xs text-black/35">__T_TASKS_EMPTY_RUNNING__</div>
        <div v-else class="space-y-2">
          <component
            :is="item._type === 'task' ? 'button' : 'div'"
            v-for="item in allItems"
            :key="item._key"
            :type="item._type === 'task' ? 'button' : undefined"
            class="flex w-full items-start gap-2.5 rounded-lg border border-black/[0.06] bg-white px-3 py-2.5 text-left transition"
            :class="item._type === 'task' ? 'cursor-pointer hover:bg-black/[0.03]' : ''"
            @click="item._type === 'task' && openTask(item.id)"
          >
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span v-if="item._type === 'schedule'" class="text-[12px] text-black/50">⏱</span>
              <span v-else-if="item.status === 'pending'" class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#222]"></span>
              <span v-else-if="item.status === 'done'" class="text-sm text-emerald-600">✓</span>
              <span v-else class="text-sm text-red-500">✗</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[12px] font-semibold leading-relaxed text-[#222]">
                {{ item._type === 'schedule' ? (item.name || '__T_TASKS_UNNAMED__') : (item.title || '__T_TASKS_UNNAMED__') }}
              </div>
              <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-black/55">
                {{ item._type === 'schedule' ? (item.prompt || '-') : (item.response || item.prompt || '-') }}
              </div>
              <div class="mt-1 flex items-center gap-2 text-[10px] text-black/35">
                <span v-if="item._type === 'schedule' && item.cron" class="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-blue-600">{{ item.cron }}</span>
                <span v-if="item._type === 'schedule'" class="flex shrink-0 items-center gap-1.5">
                  <button type="button" class="cursor-pointer rounded border px-2 py-0.5 text-[10px] transition" :class="item.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-black/10 bg-black/[0.02] text-black/35 hover:bg-black/[0.05]'" @click.stop="toggleSchedule(item)">
                    {{ item.enabled ? '__T_TASKS_ENABLED__' : '__T_TASKS_DISABLED__' }}
                  </button>
                  <button type="button" class="cursor-pointer rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-500 transition hover:bg-red-100" @click.stop="removeSchedule(item.id)">__T_TASKS_DELETE__</button>
                </span>
                <span v-if="item.app" class="rounded bg-black/[0.04] px-1.5 py-0.5 text-black/50">{{ item.app }}</span>
                <span v-if="item._type === 'task'">{{ item.created_at || '' }}</span>
              </div>
            </div>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../ws.js';
import { windowManager } from '../../stores/windowManager.js';
const tasks = ref([]);
const schedules = ref([]);
const error = ref('');

const allItems = computed(() => {
  const items = [];
  for (const s of schedules.value) {
    items.push({ ...s, _type: 'schedule', _key: `s-${s.id}` });
  }
  for (const task of tasks.value) {
    items.push({ ...task, _type: 'task', _key: `t-${task.id}` });
  }
  return items;
});

const loadTasks = async () => {
  const res = await fetch('/aios/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};

const loadSchedules = async () => {
  const res = await fetch('/aios/api/task/schedule?limit=200');
  const data = await res.json().catch(() => []);
  schedules.value = Array.isArray(data) ? data : [];
};

const loadAll = async () => {
  error.value = '';
  try {
    await Promise.all([loadTasks(), loadSchedules()]);
  } catch (e) {
    error.value = e.message || '__T_TASKS_LOAD_FAIL__';
  }
};

const openTask = (id) => { if (id) windowManager.open('task-detail', { id }); };

const toggleSchedule = async (s) => {
  try {
    await fetch('/aios/api/task/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message || '__T_TASKS_UPDATE_FAIL__';
  }
};

const removeSchedule = async (id) => {
  try {
    await fetch('/aios/api/task/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message || '__T_TASKS_DELETE_FAIL__';
  }
};

const unsubs = [];
onMounted(async () => {
  await loadAll();
  unsubs.push(on('tasks_changed', loadTasks));
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
