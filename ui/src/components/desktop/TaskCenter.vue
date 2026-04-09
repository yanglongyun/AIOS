<template>
  <Teleport to="body">
  <div class="fixed inset-x-0 top-0 bottom-[44px] z-[199]" @click.self="$emit('close')">
    <div class="absolute right-0 top-0 bottom-0 flex w-[380px] flex-col border-l border-black/[0.07] bg-white/[0.96] shadow-[-4px_0_24px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
      <!-- 顶栏 -->
      <div class="border-b border-black/[0.06] px-4 py-3">
        <div class="flex items-center justify-between">
          <span class="text-[13px] font-bold text-[#222]">__T_TASKS_CENTER__</span>
          <div class="flex items-center gap-1.5">
            <button type="button" class="rounded-[8px] border border-black/[0.1] bg-white px-2.5 py-1 text-[11px] font-medium text-black/[0.5] transition hover:bg-black/[0.04]" @click="loadAll">__T_TASKS_REFRESH__</button>
            <button @click="$emit('close')" class="flex h-6 w-6 items-center justify-center rounded-[6px] text-black/[0.35] transition-colors hover:bg-black/[0.05] hover:text-[#222]">
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="error" class="m-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-500">{{ error }}</div>

        <div v-if="allItems.length === 0" class="py-16 text-center text-[13px] text-black/[0.35]">__T_TASKS_EMPTY_RUNNING__</div>
        <div v-else>
          <div
            v-for="item in allItems"
            :key="item._key"
            class="flex items-start gap-3 border-b border-black/[0.05] px-4 py-3 transition-colors hover:bg-black/[0.03]"
            :class="item._type === 'task' ? 'cursor-pointer' : ''"
            @click="item._type === 'task' && openTaskById(item.id)"
          >
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span v-if="item._type === 'schedule'" class="text-[12px] text-black/[0.4]">⏱</span>
              <span v-else-if="item.status === 'pending'" class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#222]"></span>
              <span v-else-if="item.status === 'done'" class="text-[12px] text-emerald-500">✓</span>
              <span v-else class="text-[12px] text-red-400">✗</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] font-medium text-[#222]">{{ item._type === 'schedule' ? (item.name || '__T_TASKS_UNNAMED__') : (item.title || '__T_TASKS_UNNAMED__') }}</div>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-black/[0.38]">
                <span v-if="item._type === 'schedule' && item.cron" class="font-mono">{{ item.cron }}</span>
                <span v-if="item._type === 'task'">{{ item.created_at }}</span>
                <span v-if="item.app" class="rounded-[4px] bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-black/[0.45]">{{ item.app }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { X } from 'lucide-vue-next';
import { windowManager } from '../../stores/windowManager.js';
import { on } from '../../ws.js';

const emit = defineEmits(['close']);

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

function openTaskById(id) {
  windowManager.open('task-detail', { id: String(id) });
  emit('close');
}

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
