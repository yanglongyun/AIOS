<template>
  <div class="flex h-full flex-col bg-[#f8f8f7]">
    <!-- 顶栏 -->
    <div class="flex shrink-0 items-center justify-between border-b border-black/[0.07] bg-white px-5 py-3.5">
      <h1 class="text-[15px] font-bold text-[#222]">__T_TASKS_CENTER__</h1>
      <button
        type="button"
        class="rounded-[8px] border border-black/[0.1] bg-white px-3 py-1.5 text-[12px] font-medium text-black/50 transition hover:bg-black/[0.04]"
        @click="loadAll"
      >__T_TASKS_REFRESH__</button>
    </div>

    <!-- 内容区 -->
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
      <div class="mx-auto max-w-[860px]">
        <div v-if="error" class="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600">{{ error }}</div>

        <!-- 空状态 -->
        <div v-if="allItems.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
          <div class="mb-3 text-[36px] opacity-30">✅</div>
          <p class="text-[13px] text-black/35">__T_TASKS_EMPTY_RUNNING__</p>
        </div>

        <!-- 任务列表 -->
        <div v-else class="space-y-2">
          <component
            :is="item._type === 'task' ? 'button' : 'div'"
            v-for="item in allItems"
            :key="item._key"
            :type="item._type === 'task' ? 'button' : undefined"
            class="flex w-full items-start gap-3 rounded-[14px] border border-black/[0.07] bg-white px-4 py-3.5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all"
            :class="item._type === 'task' ? 'cursor-pointer hover:border-black/[0.13] hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)]' : ''"
            @click="item._type === 'task' && openTask(item.id)"
          >
            <!-- 状态图标 -->
            <div class="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center">
              <span v-if="item._type === 'schedule'" class="text-[14px] text-black/40">⏱</span>
              <span v-else-if="item.status === 'pending'" class="flex h-[8px] w-[8px] items-center justify-center">
                <span class="h-[8px] w-[8px] animate-pulse rounded-full bg-[#222]"></span>
              </span>
              <span v-else-if="item.status === 'done'" class="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">✓</span>
              <span v-else class="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-500">✗</span>
            </div>

            <!-- 内容 -->
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] font-semibold text-[#222]">
                {{ item._type === 'schedule' ? (item.name || '__T_TASKS_UNNAMED__') : (item.title || '__T_TASKS_UNNAMED__') }}
              </div>
              <div class="mt-0.5 line-clamp-1 text-[12px] leading-relaxed text-black/45">
                {{ item._type === 'schedule' ? (item.prompt || '-') : (item.response || item.prompt || '-') }}
              </div>
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span v-if="item._type === 'schedule' && item.cron" class="rounded-[5px] bg-black/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-black/50">{{ item.cron }}</span>
                <span v-if="item.app" class="rounded-[5px] bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-black/40">{{ item.app }}</span>
                <span v-if="item._type === 'task'" class="text-[11px] text-black/30">{{ item.created_at || '' }}</span>
              </div>
            </div>

            <!-- 定时任务操作 -->
            <div v-if="item._type === 'schedule'" class="flex shrink-0 items-center gap-1.5" @click.stop>
              <button
                type="button"
                class="rounded-[7px] border px-2.5 py-1 text-[11px] font-medium transition"
                :class="item.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-black/[0.1] bg-black/[0.03] text-black/40 hover:bg-black/[0.06]'"
                @click="toggleSchedule(item)"
              >{{ item.enabled ? '__T_TASKS_ENABLED__' : '__T_TASKS_DISABLED__' }}</button>
              <button
                type="button"
                class="rounded-[7px] border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition hover:bg-red-100"
                @click="removeSchedule(item.id)"
              >__T_TASKS_DELETE__</button>
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
  const res = await fetch('/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};

const loadSchedules = async () => {
  const res = await fetch('/api/task/schedule?limit=200');
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
    await fetch('/api/task/schedule/update', {
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
    await fetch('/api/task/schedule/delete', {
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
