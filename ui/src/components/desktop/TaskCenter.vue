<template>
  <Teleport to="body">
  <div class="fixed inset-x-0 top-0 bottom-[44px] z-[199]" @click.self="$emit('close')">
    <div class="absolute right-0 top-0 bottom-0 flex w-[380px] flex-col border-l border-[rgba(200,170,130,0.3)] bg-[rgba(250,245,238,0.96)] shadow-[-4px_0_24px_rgba(90,62,40,0.12)] backdrop-blur-2xl">
      <!-- 顶栏 -->
      <div class="border-b border-[rgba(200,170,130,0.25)] px-4 py-3">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-[13px] font-bold text-[#3a2a18]">{{ t('tasks_center') }}</span>
          <div class="flex items-center gap-1.5">
            <button type="button" class="rounded-md border border-[#d4c8b8] bg-[#fffdf8] px-2 py-1 text-[11px] text-[#7a6a58] transition hover:bg-[#f6ecde]" @click="loadAll">{{ t('tasks_refresh') }}</button>
            <button type="button" class="rounded-md border border-[#c8a060] bg-[#f8f0e0] px-2 py-1 text-[11px] font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8]" @click="openCreate">{{ t('tasks_arrange') }}</button>
            <button @click="$emit('close')" class="flex h-6 w-6 items-center justify-center rounded-md text-[#9a8870] transition-colors hover:bg-black/5 hover:text-[#5a4a38]">
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="error" class="m-3 rounded-lg border border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-[11px] text-[#c06040]">{{ error }}</div>

        <div class="px-4 pt-3 text-[11px] font-semibold text-[#8a7a68]">{{ t('tasks_tab_scheduled') }}</div>
        <div v-if="schedules.length === 0" class="py-6 text-center text-[13px] text-[#a09080]">{{ t('tasks_empty_scheduled') }}</div>
        <div v-else>
          <div
            v-for="s in schedules"
            :key="s.id"
            class="border-b border-[rgba(200,170,130,0.15)] px-4 py-3"
          >
            <div class="line-clamp-1 text-[13px] text-[#3a2a18]">{{ s.name || t('tasks_unnamed') }}</div>
            <div class="mt-0.5 line-clamp-2 text-[11px] text-[#8a7a68]">{{ s.prompt || '-' }}</div>
            <div class="mt-1 flex items-center gap-2 text-[10px] text-[#a09080]">
              <span class="rounded bg-[rgba(200,160,96,0.12)] px-1.5 py-0.5 text-[#8a6a40]">{{ s.cron ? t('tasks_repeat') : t('tasks_once') }}</span>
              <span v-if="s.cron" class="font-mono">{{ s.cron }}</span>
              <span v-if="s.run_at">{{ s.run_at }}</span>
              <button v-if="s.last_task_id" type="button" class="ml-auto cursor-pointer text-[#7a6a58] underline hover:text-[#4a3a28]" @click="openTaskById(s.last_task_id)">#{{ s.last_task_id }}</button>
            </div>
          </div>
        </div>

        <div class="px-4 pt-3 text-[11px] font-semibold text-[#8a7a68]">{{ t('tasks_tab_running') }}</div>
        <div v-if="runningTasks.length === 0" class="py-6 text-center text-[13px] text-[#a09080]">{{ t('tasks_empty_running') }}</div>
        <div v-else>
          <div
            v-for="task in runningTasks"
            :key="task.id"
            class="flex items-start gap-3 border-b border-[rgba(200,170,130,0.15)] px-4 py-3 transition-colors hover:bg-[rgba(200,160,96,0.06)]"
            @click="openTaskById(task.id)"
          >
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c8a060]"></span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] text-[#3a2a18]">{{ task.title || t('tasks_unnamed') }}</div>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-[#a09080]">
                <span>{{ task.created_at }}</span>
                <span v-if="task.app" class="rounded bg-[rgba(200,160,96,0.12)] px-1.5 py-0.5 text-[10px] text-[#8a6a40]">{{ task.app }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-4 pt-3 text-[11px] font-semibold text-[#8a7a68]">{{ t('tasks_tab_history') }}</div>
        <div v-if="historyTasks.length === 0" class="py-6 text-center text-[13px] text-[#a09080]">{{ t('tasks_empty_history') }}</div>
        <div v-else>
          <div
            v-for="task in historyTasks"
            :key="task.id"
            class="flex items-start gap-3 border-b border-[rgba(200,170,130,0.15)] px-4 py-3 transition-colors hover:bg-[rgba(200,160,96,0.06)]"
            @click="openTaskById(task.id)"
          >
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span v-if="task.status === 'done'" class="text-[12px] text-[#6a9a4a]">✓</span>
              <span v-else class="text-[12px] text-[#c04040]">✗</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] text-[#3a2a18]">{{ task.title || t('tasks_unnamed') }}</div>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-[#a09080]">
                <span>{{ task.created_at }}</span>
                <span v-if="task.app" class="rounded bg-[rgba(200,160,96,0.12)] px-1.5 py-0.5 text-[10px] text-[#8a6a40]">{{ task.app }}</span>
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
import { useI18n } from '../../i18n/index.js';
import { on } from '../../ws.js';

const { t } = useI18n();
const emit = defineEmits(['close']);

const tasks = ref([]);
const schedules = ref([]);
const error = ref('');

const runningTasks = computed(() => tasks.value.filter((x) => x.status === 'pending'));
const historyTasks = computed(() => tasks.value.filter((x) => x.status !== 'pending'));

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
    error.value = e.message || t('tasks_load_fail');
  }
};

function openTaskById(id) {
  windowManager.open('task-detail', { id: String(id) });
  emit('close');
}

function openCreate() {
  windowManager.open('task-create');
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
